import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const POSTER_TOKEN = process.env.POSTER_TOKEN || '';
const POSTER_ACCOUNT = 'galia-baluvana34';

// Supabase client will be initialized inside the handler

async function posterRequest(method: string, params: Record<string, string> = {}) {
    if (!POSTER_TOKEN) {
        throw new Error("POSTER_TOKEN environment variable is missing.");
    }

    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);

    Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
    );

    // Add cache-busting parameter
    url.searchParams.append('_t', Date.now().toString());

    // Disable Next.js fetch caching
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Poster API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(`Poster API Error response: ${data.error}`);
    }
    return data;
}

export async function POST(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        function normalizeName(value: string): string {
            if (!value) return '';
            return value.trim().toLowerCase().replace(/\s+/g, ' ');
        }

        // 5.2. Fetch active shops
        const { data: shopsRaw, error: shopsError } = await supabase.rpc('exec_sql', {
            query: `
                SELECT 
                    ds.spot_id, 
                    ds.storage_id, 
                    st.storage_name,
                    sp.name as spot_name, 
                    (ds.storage_id = 2) as is_production_hub
                FROM graviton.distribution_shops ds
                JOIN categories.storages st ON st.storage_id = ds.storage_id
                JOIN categories.spots sp ON sp.spot_id = ds.spot_id
                WHERE ds.is_active = true AND ds.storage_id IS NOT NULL
            `
        });

        if (shopsError) throw new Error(`Error fetching shops: ${shopsError.message}`);
        if (!shopsRaw || shopsRaw.length === 0) throw new Error("No active graviton shops found.");

        const storageIds = shopsRaw.map((s: any) => s.storage_id);

        // 5.4. Fetch active catalog
        const { data: catalogRaw, error: catalogError } = await supabase.rpc('exec_sql', {
            query: "SELECT product_id, product_name, is_active FROM graviton.production_catalog WHERE is_active = true"
        });

        if (catalogError) throw new Error(`Error fetching catalog: ${catalogError.message}`);

        const catalog = catalogRaw.map((c: any) => ({
            product_id: c.product_id,
            product_name: c.product_name,
            product_name_normalized: normalizeName(c.product_name),
            is_active: c.is_active
        }));

        // 5.1 & 5.6. Call Edge Function for live stocks
        let liveStocks: any[] = [];
        let failed_storages: number[] = [];
        try {
            const edgeResponse = await fetch('https://supabase.dmytrotovstytskyi.online/functions/v1/poster-live-stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storage_ids: storageIds })
            });

            if (!edgeResponse.ok) {
                throw new Error(`Edge Function returned HTTP ${edgeResponse.status}`);
            }

            const edgeResult = await edgeResponse.json();

            // 5.6. Check for partial failure or missing payload
            if (!edgeResult || !edgeResult.storages_status) {
                throw new Error("Edge Function returned invalid payload.");
            }

            // 5.6. Track storages that still need fetching
            let pendingStorages = [...storageIds];

            // 5.7. Mark storages successful from Edge Function
            const storagesStatus = edgeResult.storages_status || [];
            const edgeSuccessfulIds = storagesStatus
                .filter((s: any) => s.status === 'success')
                .map((s: any) => s.storage_id);

            pendingStorages = pendingStorages.filter(id => !edgeSuccessfulIds.includes(id));

            // 5.8. Normalize successfully fetched live stocks from Edge Function
            liveStocks = (edgeResult.rows || []).map((item: any) => ({
                storage_id: item.storage_id,
                ingredient_id: item.ingredient_id,
                ingredient_name: item.ingredient_name,
                ingredient_name_normalized: normalizeName(item.ingredient_name),
                stock_left: parseFloat(item.stock_left || item.ingredient_left || item.storage_ingredient_left || '0'),
                unit: item.unit || item.ingredient_unit || 'кг'
            }));

            // --- FALLBACK: Fetch missing/failed storages directly from Poster ---
            if (pendingStorages.length > 0) {
                console.warn(`Edge Function failed for [${pendingStorages.join(', ')}]. Falling back to direct API.`);
                const fallbacks = [...pendingStorages];
                for (const storageId of fallbacks) {
                    try {
                        const directData = await posterRequest('storage.getStorageLeftovers', {
                            storage_id: String(storageId)
                        });
                        if (directData && directData.response) {
                            const normalizedDirect = (directData.response || []).map((item: any) => ({
                                storage_id: storageId,
                                ingredient_id: parseInt(item.ingredient_id),
                                ingredient_name: item.ingredient_name,
                                ingredient_name_normalized: normalizeName(item.ingredient_name),
                                stock_left: parseFloat(item.stock_left || item.ingredient_left || item.storage_ingredient_left || '0'),
                                unit: item.unit || 'кг'
                            }));
                            liveStocks.push(...normalizedDirect);
                            // Mark as success (remove from pending)
                            pendingStorages = pendingStorages.filter(id => id !== storageId);
                        }
                    } catch (directErr) {
                        console.error(`Direct fallback failed for storage ${storageId}:`, directErr);
                    }
                }
            }

            failed_storages = pendingStorages;


        } catch (err: any) {
            console.error("Edge Function Error:", err);
            throw new Error(`Live stocks sync failed: ${err.message}`);
        }

        // 5.8. Fetch manufactures for today (Europe/Kyiv timezone)
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
        let manufactures: any[] = [];
        let manufactures_warning = false;
        let production_summary = {
            total_kg: 0,
            storage_id: 2,
            items_count: 0
        };

        try {
            const manufacturesData = await posterRequest('storage.getManufactures', {
                dateFrom: dateStr,
                dateTo: dateStr
            });

            const rawManufactures = (manufacturesData.response || []) as any[];
            const catalogNamesNormalized = new Set(catalog.map((c: any) => c.product_name_normalized));

            rawManufactures.forEach((m: any) => {
                const storageId = parseInt(m.storage_id);
                // 1. Only Graviton Production Hub (Storage ID 2)
                if (storageId !== 2) return;

                if (m.products && Array.isArray(m.products)) {
                    m.products.forEach((p: any) => {
                        const name = p.product_name || p.ingredient_name || '';
                        const normalized = normalizeName(name);
                        const quantity = parseFloat(p.product_num || '0');

                        // 2. Only items in Graviton catalog
                        if (name && catalogNamesNormalized.has(normalized)) {
                            manufactures.push({
                                storage_id: storageId,
                                product_id: p.product_id ? parseInt(p.product_id) : undefined,
                                product_name: name,
                                product_name_normalized: normalized,
                                quantity: quantity
                            });

                            production_summary.total_kg += quantity;
                            production_summary.items_count++;
                        }
                    });
                }
            });

            // Clean up numbers
            production_summary.total_kg = parseFloat(production_summary.total_kg.toFixed(3));

        } catch (err) {
            console.error("Error fetching manufactures:", err);
            manufactures_warning = true;
            production_summary.total_kg = 0;
            production_summary.items_count = 0;
        }

        // 5.10. Return unified payload
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            shops: shopsRaw.map((s: any) => ({
                spot_id: s.spot_id,
                storage_id: s.storage_id,
                spot_name: s.spot_name,
                storage_name: s.storage_name,
                is_production_hub: !!s.is_production_hub
            })),
            catalog,
            live_stocks: liveStocks,
            manufactures,
            production_summary,
            manufactures_warning,
            partial_sync: failed_storages.length > 0,
            failed_storages
        });

    } catch (error: any) {
        console.error("Graviton Sync Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const POSTER_TOKEN = process.env.POSTER_TOKEN || '';
const POSTER_ACCOUNT = 'galia-baluvana34';

// Initialize Supabase admin client to bypass RLS while inserting from server
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function posterRequest(method: string, params: Record<string, string> = {}) {
    if (!POSTER_TOKEN) {
        throw new Error("POSTER_TOKEN environment variable is missing.");
    }

    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);

    Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
    );

    const response = await fetch(url.toString());
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
        // 1. Fetch active shops from Graviton
        const { data: shops, error: shopsError } = await supabase
            .from('distribution_shops')
            .select('storage_id')
            .eq('is_active', true)
            .not('storage_id', 'is', null);

        if (shopsError) throw new Error(`Error fetching shops: ${shopsError.message}`);
        if (!shops || shops.length === 0) throw new Error("No active graviton shops found.");

        const storageIds = shops.map(s => s.storage_id);

        // 2. Fetch Graviton production catalog
        const { data: catalog, error: catalogError } = await supabase
            .from('production_catalog')
            .select('product_id')
            .eq('is_active', true);

        if (catalogError) throw new Error(`Error fetching catalog: ${catalogError.message}`);
        if (!catalog || catalog.length === 0) throw new Error("Production catalog is empty.");

        const gravitonProductIds = catalog.map(c => String(c.product_id));

        // 3. Fetch leftovers from Poster in parallel
        const promises = storageIds.map(async (storageId) => {
            const data = await posterRequest('storage.getStorageLeftovers', {
                storage_id: String(storageId)
            });

            const rawLeftovers = (data.response || []) as any[];
            // Filter leftovers to match only Graviton products
            const filteredLeftovers = rawLeftovers.filter(item =>
                gravitonProductIds.includes(String(item.ingredient_id))
            );

            return filteredLeftovers.map(item => ({
                storage_id: storageId,
                ingredient_id: parseInt(item.ingredient_id, 10),
                ingredient_name: item.ingredient_name || item.product_name || 'Неизвестно',
                storage_ingredient_left: parseFloat(item.ingredient_left || item.storage_ingredient_left || '0'),
                ingredient_unit: item.ingredient_unit || 'кг',
                updated_at: new Date().toISOString()
            }));
        });

        const resultsArray = await Promise.all(promises);
        const allFilteredLeftovers = resultsArray.flat();

        // 4. Batch upsert to graviton.stocks_now
        if (allFilteredLeftovers.length > 0) {
            const { error: upsertError } = await supabase
                .schema('graviton')
                .from('stocks_now')
                .upsert(allFilteredLeftovers, {
                    onConflict: 'storage_id, ingredient_id'
                });

            if (upsertError) throw new Error(`Upsert error: ${upsertError.message}`);
        }

        // 5. Fetch Manufactures for Today
        const dateStr = new Date().toISOString().split('T')[0];
        const manufacturesData = await posterRequest('storage.getManufactures', {
            dateFrom: dateStr,
            dateTo: dateStr
        });

        const rawManufactures = (manufacturesData.response || []) as any[];

        const manufacturesToInsert = rawManufactures.map(m => ({
            manufacture_id: parseInt(m.manufacture_id, 10),
            storage_id: parseInt(m.storage_id, 10),
            user_id: parseInt(m.user_id, 10),
            manufacture_date: m.date,
            total_sum: parseFloat(m.sum || '0')
        }));

        const itemsToInsert: any[] = [];
        rawManufactures.forEach(m => {
            const m_id = parseInt(m.manufacture_id, 10);
            if (m.products && Array.isArray(m.products)) {
                m.products.forEach((p: any) => {
                    itemsToInsert.push({
                        manufacture_id: m_id,
                        ingredient_id: parseInt(p.ingredient_id, 10),
                        product_id: parseInt(p.product_id, 10),
                        product_name: p.product_name,
                        quantity: parseFloat(p.product_num || '0'),
                        type: parseInt(p.type || '0', 10),
                        is_deleted: p.delete === '1'
                    });
                });
            }
        });

        if (manufacturesToInsert.length > 0) {
            const { error: mfgError } = await supabase
                .schema('graviton')
                .from('manufactures')
                .upsert(manufacturesToInsert, { onConflict: 'manufacture_id' });

            if (mfgError) throw new Error(`Mfg upsert error: ${mfgError.message}`);

            const mfgIds = manufacturesToInsert.map(m => m.manufacture_id);
            await supabase.schema('graviton').from('manufacture_items').delete().in('manufacture_id', mfgIds);

            if (itemsToInsert.length > 0) {
                const { error: itemsError } = await supabase
                    .schema('graviton')
                    .from('manufacture_items')
                    .insert(itemsToInsert);
                if (itemsError) throw new Error(`Items insert error: ${itemsError.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            synced_storages: storageIds.length,
            synced_items: allFilteredLeftovers.length,
            synced_manufactures: manufacturesToInsert.length,
            synced_manufactured_items: itemsToInsert.length
        });

    } catch (error: any) {
        console.error("Graviton Sync Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

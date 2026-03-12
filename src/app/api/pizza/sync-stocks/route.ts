import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth-guard';

const POSTER_TOKEN = process.env.POSTER_TOKEN || '';
const POSTER_ACCOUNT = 'galia-baluvana34';

function hasInternalApiAccess(request: Request): boolean {
    const secret = process.env.INTERNAL_API_SECRET;
    if (!secret) return false;

    const authHeader = request.headers.get('authorization');
    const headerSecret = request.headers.get('x-internal-api-secret');

    return authHeader === `Bearer ${secret}` || headerSecret === secret;
}

async function posterRequest(method: string, params: Record<string, string> = {}) {
    if (!POSTER_TOKEN) {
        throw new Error('POSTER_TOKEN environment variable is missing.');
    }

    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);

    Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key])
    );

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
        throw new Error(`Poster API Error (${method}): ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.response;
}

export async function POST(request: Request) {
    console.log('[Pizza Sync] Starting synchronous update...');

    try {
        if (!hasInternalApiAccess(request)) {
            const auth = await requireAuth();
            if (auth.error) return auth.error;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase service credentials');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const pizzaDb = supabase.schema('pizza1');

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        // 1. Fetch stocks for all map-linked storages
        const shopStorageIds = [2, 3, 5, 6, 7, 8, 9, 20, 21, 25, 26, 30, 33, 34, 36, 39, 43, 44, 45, 47, 52, 53, 55];
        console.log(`[Pizza Sync] Fetching stocks for ${shopStorageIds.length} storages...`);

        const stocksPromises = shopStorageIds.map(async (id) => {
            try {
                const data = await posterRequest('storage.getStorageLeftovers', { storage_id: String(id) });
                return { storage_id: id, items: data || [] };
            } catch (err) {
                console.error(`[Pizza Sync] Error fetching storage ${id}:`, err);
                return { storage_id: id, items: [] };
            }
        });

        const stocksResults = await Promise.all(stocksPromises);
        const allStocks: any[] = [];

        stocksResults.forEach((res) => {
            res.items.forEach((item: any) => {
                allStocks.push({
                    snapshot_date: today,
                    storage_id: res.storage_id,
                    ingredient_id: Number(item.ingredient_id),
                    ingredient_name: item.ingredient_name,
                    storage_ingredient_left: Number(item.storage_ingredient_left || 0),
                    ingredient_unit: item.ingredient_unit,
                    created_at: now,
                });
            });
        });

        // 2. Replace today's stocks snapshot
        console.log('[Pizza Sync] Replacing stocks snapshot...');
        const { error: clearStocksError } = await pizzaDb
            .from('stocks_now')
            .delete()
            .eq('snapshot_date', today);

        if (clearStocksError) throw clearStocksError;

        console.log(`[Pizza Sync] Inserting ${allStocks.length} stock rows...`);
        for (let i = 0; i < allStocks.length; i += 1000) {
            const chunk = allStocks.slice(i, i + 1000);
            const { error: insertStocksError } = await pizzaDb
                .from('stocks_now')
                .insert(chunk);
            if (insertStocksError) throw insertStocksError;
        }

        // 3. Handle manufactures
        console.log("[Pizza Sync] Fetching today's manufactures...");
        const manufactures = await posterRequest('storage.getManufactures', {
            dateFrom: today,
            dateTo: today,
        });

        if (Array.isArray(manufactures)) {
            const workshopMans = manufactures.filter((m: any) => String(m.storage_id) === '15');
            console.log(`[Pizza Sync] Found ${workshopMans.length} workshop manufactures.`);

            if (workshopMans.length > 0) {
                const manIds = workshopMans
                    .map((m: any) => Number(m.manufacture_id))
                    .filter((id: number) => Number.isFinite(id));

                if (manIds.length > 0) {
                    const { error: delItemsError } = await pizzaDb
                        .from('manufacture_items')
                        .delete()
                        .in('manufacture_id', manIds);
                    if (delItemsError) throw delItemsError;

                    const { error: delHeadersError } = await pizzaDb
                        .from('manufactures')
                        .delete()
                        .in('manufacture_id', manIds);
                    if (delHeadersError) throw delHeadersError;
                }

                const manufactureHeaders = workshopMans.map((man: any) => ({
                    manufacture_id: Number(man.manufacture_id),
                    storage_id: Number(man.storage_id),
                    user_id: Number(man.user_id),
                    manufacture_date: man.date,
                    total_sum: Number(man.sum || 0),
                }));

                if (manufactureHeaders.length > 0) {
                    const { error: insertHeadersError } = await pizzaDb
                        .from('manufactures')
                        .insert(manufactureHeaders);
                    if (insertHeadersError) throw insertHeadersError;
                }

                const manufactureItems = workshopMans.flatMap((man: any) =>
                    (man.products || []).map((p: any) => ({
                        manufacture_id: Number(man.manufacture_id),
                        product_id: Number(p.product_id || 0),
                        ingredient_id: Number(p.ingredient_id || 0),
                        product_name: String(p.product_name || ''),
                        quantity: Number(p.product_num || 0),
                        type: Number(p.type || 1),
                        is_deleted: false,
                    }))
                );

                for (let i = 0; i < manufactureItems.length; i += 1000) {
                    const chunk = manufactureItems.slice(i, i + 1000);
                    const { error: insertItemsError } = await pizzaDb
                        .from('manufacture_items')
                        .insert(chunk);
                    if (insertItemsError) throw insertItemsError;
                }
            }
        }

        console.log('[Pizza Sync] Finished successfully!');
        return NextResponse.json({ success: true, count: allStocks.length });

    } catch (error: any) {
        console.error('[Pizza Sync] Critical Failure:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || String(error),
            },
            { status: 500 }
        );
    }
}


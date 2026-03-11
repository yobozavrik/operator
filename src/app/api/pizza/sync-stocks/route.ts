import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const POSTER_TOKEN = process.env.POSTER_TOKEN || '';
const POSTER_ACCOUNT = 'galia-baluvana34';

async function posterRequest(method: string, params: Record<string, string> = {}) {
    if (!POSTER_TOKEN) {
        throw new Error("POSTER_TOKEN environment variable is missing.");
    }

    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);

    Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
    );

    // Filter out undefined values
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
        throw new Error(`Poster API Error (${method}): ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.response;
}

export async function POST() {
    console.log('[Pizza Sync] Starting synchronous update...');

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        // 1. Fetch Stocks for all 23 map-linked storages
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

        stocksResults.forEach(res => {
            res.items.forEach((item: any) => {
                allStocks.push({
                    snapshot_date: today,
                    storage_id: res.storage_id,
                    ingredient_id: Number(item.ingredient_id),
                    ingredient_name: item.ingredient_name,
                    storage_ingredient_left: Number(item.storage_ingredient_left || 0),
                    ingredient_unit: item.ingredient_unit,
                    created_at: now
                });
            });
        });

        // 2. Database Transactions via exec_sql
        console.log('[Pizza Sync] Clearing old data via RPC...');

        // Clear today's stocks
        await supabase.rpc('exec_sql', {
            query: `DELETE FROM pizza1.stocks_now WHERE snapshot_date = '${today}'`
        });

        // INSERT STOCKS in chunks
        console.log(`[Pizza Sync] Inserting ${allStocks.length} stock rows...`);
        for (let i = 0; i < allStocks.length; i += 1000) {
            const chunk = allStocks.slice(i, i + 1000);
            const values = chunk.map(s =>
                `('${s.snapshot_date}', ${s.storage_id}, ${s.ingredient_id}, '${s.ingredient_name.replace(/'/g, "''")}', ${s.storage_ingredient_left}, '${s.ingredient_unit}', '${s.created_at}')`
            ).join(',');

            const query = `
                INSERT INTO pizza1.stocks_now 
                (snapshot_date, storage_id, ingredient_id, ingredient_name, storage_ingredient_left, ingredient_unit, created_at)
                VALUES ${values}
            `;
            const { error: insertError } = await supabase.rpc('exec_sql', { query });
            if (insertError) throw insertError;
        }

        // 3. Handle Manufactures
        console.log('[Pizza Sync] Fetching today\'s manufactures...');
        const manufactures = await posterRequest('storage.getManufactures', {
            dateFrom: today,
            dateTo: today
        });

        if (Array.isArray(manufactures)) {
            // Filter only storage 15 (Workshop) as used in pizza1 views
            const workshopMans = manufactures.filter((m: any) => String(m.storage_id) === '15');
            console.log(`[Pizza Sync] Found ${workshopMans.length} workshop manufactures.`);

            if (workshopMans.length > 0) {
                // Clear old workshop mans for today
                const manIds = workshopMans.map(m => m.manufacture_id);
                const manIdsStr = manIds.join(',');

                await supabase.rpc('exec_sql', {
                    query: `DELETE FROM pizza1.manufacture_items WHERE manufacture_id IN (${manIdsStr})`
                });
                await supabase.rpc('exec_sql', {
                    query: `DELETE FROM pizza1.manufactures WHERE manufacture_id IN (${manIdsStr})`
                });

                // Insert Manufactures and Items
                for (const man of workshopMans) {
                    // Header
                    await supabase.rpc('exec_sql', {
                        query: `INSERT INTO pizza1.manufactures (manufacture_id, storage_id, user_id, manufacture_date, total_sum)
                                VALUES (${man.manufacture_id}, ${man.storage_id}, ${man.user_id}, '${man.date}', ${man.sum || 0})`
                    });

                    // Items (if present in the initial fetch)
                    if (man.products && man.products.length > 0) {
                        const itemValues = man.products.map((p: any) =>
                            `(${man.manufacture_id}, ${p.product_id || 0}, ${p.ingredient_id || 0}, '${(p.product_name || '').replace(/'/g, "''")}', ${p.product_num || 0}, ${p.type || 1}, false)`
                        ).join(',');

                        await supabase.rpc('exec_sql', {
                            query: `INSERT INTO pizza1.manufacture_items (manufacture_id, product_id, ingredient_id, product_name, quantity, type, is_deleted)
                                    VALUES ${itemValues}`
                        });
                    }
                }
            }
        }

        console.log('[Pizza Sync] Finished successfully!');
        return NextResponse.json({ success: true, count: allStocks.length });

    } catch (error: any) {
        console.error('[Pizza Sync] Critical Failure:', error);
        return NextResponse.json({
            success: false,
            error: error.message || String(error)
        }, { status: 500 });
    }
}

// src/lib/poster-merger.ts
import { getAllLeftovers } from './posterApi';

interface DbOrderRow {
    product_id: string;
    product_name: string;
    spot_name: string;
    avg_sales_day: number;
    min_stock: number;
    stock_now: number;
    baked_at_factory: number;
    need_net: number;
    [key: string]: any;
}

const normalizeStore = (n: string) => {
    let clean = (n || '').toLowerCase().replace(/['"«»]/g, '');
    clean = clean.replace('магазин', '').trim();
    return clean;
};
const normalizeProd = (n: string) => (n || '').toLowerCase().replace(/['"«»\s]/g, '');

import { getKonditerkaUnit } from './konditerka-dictionary';

/**
 * Fetches all live stock from Poster API and merges it with Supabase distribution stats logic.
 * This guarantees the Dashboard always shows accurate, real-time stock and deficit calculations.
 */
export async function mergeWithPosterLiveStock(dbData: DbOrderRow[]): Promise<DbOrderRow[]> {
    const startTime = Date.now();
    const allLeftovers = await getAllLeftovers();
    const duration_ms = Date.now() - startTime;

    let posterRecords = 0;
    const storages_count = allLeftovers.length;

    // Map the Poster response for O(1) lookups
    const posterMap: Record<string, Record<string, number>> = {};
    for (const shop of allLeftovers) {
        posterRecords += shop.leftovers?.length || 0;
        const sKey = normalizeStore(shop.storage_name);
        if (!posterMap[sKey]) posterMap[sKey] = {};
        for (const item of shop.leftovers) {
            const pKey = normalizeProd(item.ingredient_name || '');
            // storage_ingredient_left is the stock for THIS specific storage container
            posterMap[sKey][pKey] = Number(item.storage_ingredient_left) || 0;
        }
    }

    // Required Audit Log
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'poster_api_fetch',
        duration_ms,
        storages_count,
        records_count: posterRecords,
        success: true
    }));

    // Replace the dbData row values with the hyper-live Poster metrics
    const mergedData = dbData.map(row => {
        const sKey = normalizeStore(row.spot_name);
        const pKey = normalizeProd(row.product_name);

        let liveStock = row.stock_now; // Fallback to Supabase if we truly have no data from Poster
        if (posterMap[sKey] && posterMap[sKey][pKey] !== undefined) {
            liveStock = posterMap[sKey][pKey];

            // ALIGNMENT FIX: Poster returns native kilograms (e.g. 1.5kg). 
            // The old Supabase SQL views computed `min_stock` in Grams (e.g. 1500g).
            // Therefore, if the item is sold in Kg, we MUST scale the `liveStock` back to Grams!
            // Otherwise, UI transform (which divides by 1000) causes 1.5kg to become 0kg.
            if (getKonditerkaUnit(row.product_name) === 'кг') {
                liveStock = Math.round(liveStock * 1000);
            }
        }

        // The magic: if Poster reports fewer stock, re-calculate the `need_net` logic directly in JS
        const newNeedNet = Math.max(0, row.min_stock - Math.max(0, liveStock));

        return {
            ...row,
            stock_now: liveStock,
            need_net: newNeedNet
        };
    });

    console.timeEnd("Poster API Fetch & Merge");
    return mergedData;
}

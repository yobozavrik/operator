import { SupabaseDeficitRow, ProductionTask, PriorityKey, SKUCategory } from '@/types/bi';

export const GRAVITON_SHOPS = [
    { id: 3, name: 'Кварц' },
    { id: 6, name: 'Руська' },
    { id: 10, name: 'Садгора' },
    { id: 16, name: 'Хотинська' },
    { id: 17, name: 'Компас' },
    { id: 20, name: 'Білоруська' }
];

export const STORES = GRAVITON_SHOPS.map(s => `Магазин "${s.name}"`);

export interface SKU {
    id: string;
    name: string;
    category: SKUCategory;
    currentStockKg: number;
    avgSalesKg: number;
    minStockKg: number;
}

export const mockSKUs: SKU[] = [
    { id: '1', name: 'Вареники з картоплею', category: 'ВАРЕНИКИ', currentStockKg: 12.5, avgSalesKg: 8.2, minStockKg: 25 },
    { id: '2', name: 'Пельмені "Домашні"', category: 'ПЕЛЬМЕНІ', currentStockKg: 5.0, avgSalesKg: 12.0, minStockKg: 40 },
    { id: '3', name: 'Хінкалі з яловичиною', category: 'ХІНКАЛІ', currentStockKg: 18.2, avgSalesKg: 5.5, minStockKg: 15 },
    { id: '4', name: 'Чебуреки з м\'ясом', category: 'ЧЕБУРЕКИ', currentStockKg: 2.1, avgSalesKg: 15.0, minStockKg: 30 },
];

export function getProductionQueue(skus: SKU[]): ProductionTask[] {
    return skus.map(sku => {
        const deficit = sku.minStockKg - sku.currentStockKg;
        const deficitPercent = (deficit / sku.minStockKg) * 100;

        let priority: PriorityKey = 'normal';
        if (sku.currentStockKg === 0) priority = 'critical';
        else if (sku.currentStockKg < sku.minStockKg * 0.5) priority = 'high';
        else if (sku.currentStockKg < sku.minStockKg) priority = 'reserve';

        return {
            id: sku.id,
            productCode: Number(sku.id),
            name: sku.name,
            category: sku.category,
            totalStockKg: sku.currentStockKg,
            dailyForecastKg: sku.avgSalesKg,
            minStockThresholdKg: sku.minStockKg,
            outOfStockStores: sku.currentStockKg === 0 ? 3 : 0,
            salesTrendKg: [sku.avgSalesKg * 0.8, sku.avgSalesKg * 1.1, sku.avgSalesKg],
            stores: [
                {
                    storeId: 1,
                    storeName: 'Магазин "Садгора"',
                    currentStock: sku.currentStockKg * 0.4,
                    minStock: sku.minStockKg * 0.4,
                    deficitKg: Math.max(0, (sku.minStockKg - sku.currentStockKg) * 0.4),
                    recommendedKg: Math.ceil(((sku.minStockKg - sku.currentStockKg) * 0.4) / 10) * 10,
                    avgSales: sku.avgSalesKg * 0.4
                },
                {
                    storeId: 2,
                    storeName: 'Магазин "Компас"',
                    currentStock: sku.currentStockKg * 0.6,
                    minStock: sku.minStockKg * 0.6,
                    deficitKg: Math.max(0, (sku.minStockKg - sku.currentStockKg) * 0.6),
                    recommendedKg: Math.ceil(((sku.minStockKg - sku.currentStockKg) * 0.6) / 10) * 10,
                    avgSales: sku.avgSalesKg * 0.6
                }
            ],
            recommendedQtyKg: Math.max(0, Math.ceil(deficit / 10) * 10),
            priority,
            priorityReason: priority === 'critical' ? 'Stock Out' : 'Below Minimum',
            status: 'pending' as const,
            deficitPercent: Math.max(0, deficitPercent)
        };
    });
}

/**
 * Transform raw Supabase data to ProductionTask
 * Relies on DB View for priority mapping
 */
export function transformDeficitData(data: SupabaseDeficitRow[]): ProductionTask[] {
    if (!data || !Array.isArray(data)) return [];

    return data.map((row) => {
        return {
            id: `${row.код_продукту}-${row.код_магазину}`,
            productCode: row.код_продукту,
            name: row.назва_продукту,
            category: (row.category_name?.toUpperCase() as SKUCategory) || 'Інше',
            totalStockKg: Number(row.current_stock),
            dailyForecastKg: Number(row.avg_sales_day),
            minStockThresholdKg: Number(row.min_stock),
            outOfStockStores: Number(row.current_stock) === 0 ? 1 : 0,
            salesTrendKg: [row.avg_sales_day],
            stores: [{
                storeId: row.код_магазину,
                storeName: row.назва_магазину,
                currentStock: Number(row.current_stock),
                minStock: Number(row.min_stock),
                deficitKg: Number(row.deficit_kg),
                recommendedKg: Number(row.recommended_kg),
                avgSales: Number(row.avg_sales_day)
            }],
            recommendedQtyKg: Number(row.recommended_kg),
            priority: row.priority as PriorityKey,
            storeName: row.назва_магазину,
            priorityReason: `Store: ${row.назва_магазину}`,
            status: 'pending' as const,
            deficitPercent: Number(row.deficit_percent)
        };
    });
}

// Alias for backward compatibility
export const transformSupabaseData = transformDeficitData;


/**
 * Transformer for Pizza View (pizza1.v_pizza_orders)
 * Maps flat structure to ProductionTask
 */
export function transformPizzaData(data: any[]): ProductionTask[] {
    if (!data || !Array.isArray(data)) return [];

    const productMap = new Map<string, ProductionTask>();
    let autoIdCounter = 1000; // Fallback counter for missing IDs

    // DEBUG: Log first row to see structure
    if (data.length > 0) {
        console.log('[Transform Pizza] First Row:', data[0]);
        console.log('[Transform Pizza] Keys:', Object.keys(data[0]));
    }

    // Helper for safe number parsing (handles commas, nulls, undefined)
    const safeNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const clean = val.replace(',', '.').replace(/[^0-9.-]/g, '');
            return Number(clean) || 0;
        }
        return 0;
    };

    data.forEach((row) => {
        // Safe number parsing with comma support
        // MAPPING BASED ON USER LOGS: stock_now, norm_3_days, need_net
        const stock = safeNumber(row.current_stock || row.stock || row.stock_now || row.quantity);
        const min = safeNumber(row.min_stock || row.min || row.norm_3_days || row.min_qty);
        const netNeed = safeNumber(row.net_need || row.need || row.need_net || row.deficit);

        // Calculate avg if missing (assuming norm is for 3 days as per column name 'norm_3_days')
        let avg = safeNumber(row.avg_sales_day || row.avg_sales || row.avg);
        if (avg === 0 && min > 0) {
            avg = min / 3;
        }

        // Use product_id (or product_name if id missing) as unique key
        const productKey = row.product_id
            ? String(row.product_id)
            : (row.product_name || row.pizza_name || row.назва_продукту);

        if (!productKey) {
            console.warn('[Transform Pizza] Skipper row - no product key:', row);
            return;
        }

        // Build Store Object
        const storeObj = {
            storeId: row.store_id || row.spot_id || row.code || 0,
            storeName: row.store_name || row.shop_name || row.spot_name || row.назва_магазину || 'Магазин',
            currentStock: stock,
            minStock: min,
            deficitKg: Math.max(0, netNeed),
            recommendedKg: Math.max(0, netNeed),
            avgSales: avg,
            distributionPlan: 0,
            surplusPriority: row.surplus_priority || row.priority
        };

        if (productMap.has(productKey)) {
            // Aggregate to existing Product
            const existing = productMap.get(productKey)!;
            existing.totalStockKg += stock;
            existing.dailyForecastKg += avg;
            existing.minStockThresholdKg += min; // Sum up min stock thresholds
            existing.stores.push(storeObj);

            // Check trend or other aggregation logic if needed
            if (stock === 0) existing.outOfStockStores += 1;

        } else {
            // Create new Product entry
            const numericCode = row.product_id ? Number(row.product_id) : autoIdCounter++;

            productMap.set(productKey, {
                id: productKey,
                productCode: numericCode,
                name: row.product_name || row.назва_продукту || 'Unknown Product',
                category: 'ПІЦА', // Force single category
                totalStockKg: stock,
                dailyForecastKg: avg,
                minStockThresholdKg: min,
                outOfStockStores: stock === 0 ? 1 : 0,
                salesTrendKg: [avg], // Simple init
                stores: [storeObj],
                recommendedQtyKg: Math.max(0, netNeed),
                priority: 'normal',
                storeName: 'Multiple',
                priorityReason: 'Pizza Distribution',
                status: 'pending',
                deficitPercent: 0
            });
        }

    });

    return Array.from(productMap.values());
}

import { SupabaseDeficitRow, ProductionTask, PriorityKey, SKUCategory } from '@/types/bi';

export const STORES = [
    'Магазин "Садгора"',
    'Магазин "Компас"',
    'Магазин "Руська"',
    'Магазин "Хотинська"',
    'Магазин "Білоруська"',
    'Магазин "Кварц"'
];

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


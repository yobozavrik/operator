import { SupabaseDeficitRow, ProductionTask, PriorityKey, SKUCategory } from '@/types/bi';

export function calculatePriority(row: SupabaseDeficitRow): PriorityKey {
    const currentStock = Number(row.current_stock);
    const minStock = Number(row.min_stock);
    const avgSalesDay = Number(row.avg_sales_day);

    if (currentStock === 0 || currentStock < minStock) {
        return 'critical';
    }

    if (currentStock < minStock * 1.3 && avgSalesDay > 3) {
        return 'high';
    }

    if (currentStock < minStock * 2.0) {
        return 'reserve';
    }

    return 'normal';
}

export function transformDeficitData(data: SupabaseDeficitRow[]): ProductionTask[] {
    if (!data || !Array.isArray(data)) return [];

    return data.map((row) => {
        const priority = calculatePriority(row);

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
            priority: priority,
            storeName: row.назва_магазину,
            priorityReason: `Store: ${row.назва_магазину}`,
            status: 'pending' as const,
            deficitPercent: Number(row.deficit_percent)
        };
    });
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function safeNumber(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

async function run() {
    const { data: dbData } = await supabase
        .schema('konditerka1')
        .from('v_konditerka_distribution_stats')
        .select('*');

    const productMap = new Map();
    let autoIdCounter = 1;
    let autoStoreIdCounter = 1;
    const storeIdMap = new Map();

    dbData.forEach((row) => {
        const stock = safeNumber(row.current_stock || row.stock || row.stock_now || row.quantity);
        const min = safeNumber(row.min_stock || row.min || row.norm_3_days || row.min_qty);
        const netNeed = safeNumber(row.net_need || row.need || row.need_net || row.deficit);
        let avg = safeNumber(row.avg_sales_day || row.avg_sales || row.avg);
        if (avg === 0 && min > 0) avg = min / 3;

        const productKey = row.product_id ? String(row.product_id) : (row.product_name || row.pizza_name || row.назва_продукту);
        if (!productKey) return;

        const storeName = row.store_name || row.shop_name || row.spot_name || row.назва_магазину || 'Магазин';
        let storeId = row.store_id || row.spot_id || row.code;
        if (!storeId) {
            if (!storeIdMap.has(storeName)) storeIdMap.set(storeName, autoStoreIdCounter++);
            storeId = storeIdMap.get(storeName);
        }

        const storeObj = {
            storeId: storeId,
            storeName: storeName,
            currentStock: stock,
            minStock: min,
            deficitKg: Math.max(0, netNeed),
            recommendedKg: Math.max(0, netNeed),
            avgSales: avg,
            distributionPlan: 0,
            surplusPriority: row.surplus_priority || row.priority
        };

        if (productMap.has(productKey)) {
            const existing = productMap.get(productKey);
            existing.totalStockKg += stock;
            existing.dailyForecastKg += avg;
            existing.minStockThresholdKg += min;
            existing.stores.push(storeObj);
            if (stock === 0) existing.outOfStockStores += 1;
        } else {
            const numericCode = row.product_id ? Number(row.product_id) : autoIdCounter++;
            productMap.set(productKey, {
                id: productKey,
                productCode: numericCode,
                name: row.product_name,
                totalStockKg: stock,
                dailyForecastKg: avg,
                minStockThresholdKg: min,
                outOfStockStores: stock === 0 ? 1 : 0,
                salesTrendKg: [avg],
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

    const transformedData = Array.from(productMap.values()).map(task => {
        // Mock getKonditerkaUnit, just pretend everything is шт for now to see absolute max sum.
        const multiplier = 1;

        return {
            ...task,
            totalStockKg: task.totalStockKg * multiplier,
            stores: task.stores.map(store => ({
                ...store,
                currentStock: store.currentStock * multiplier,
            }))
        };
    });

    const totalNetworkStock = transformedData.reduce((sum, p) => {
        const prodStock = p.stores?.reduce((sSum, s) => sSum + (Number(s.currentStock) || 0), 0) || 0;
        return sum + prodStock;
    }, 0);

    console.log("Calculated Total Network Stock:", totalNetworkStock);
}

run();

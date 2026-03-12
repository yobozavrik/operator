import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { normalizeFloridaUnit } from '@/lib/florida-dictionary';
import { normalizeFloridaMetrics } from '@/lib/florida-metrics';
import { fetchFloridaEdgeStocks, syncFloridaStocksFromEdge } from '@/lib/florida-stock-sync';
import type { FloridaEdgeStockRow } from '@/lib/florida-stock-sync';
import {
    BRANCH_CONFIGS,
    buildBranchAnalytics,
    buildBranchOrderPlan,
    calculateBranchDistribution,
    coercePositiveInt,
    createServiceRoleClient,
    fetchBranchRows,
} from '@/lib/branch-api';
import { fetchFloridaProduction180dProductIds } from '@/lib/florida-production-180d';
import { syncBranchProductionFromPoster } from '@/lib/branch-production-sync';

export const dynamic = 'force-dynamic';

const config = BRANCH_CONFIGS.florida;

async function fetchFloridaUnitMap(supabase: ReturnType<typeof createServiceRoleClient>, productIds: number[]) {
    const unitByProductId = new Map<number, string>();
    if (productIds.length === 0) return unitByProductId;

    const { data, error } = await supabase
        .schema('categories')
        .from('products')
        .select('id, unit')
        .in('id', productIds);

    if (error) return unitByProductId;

    (data || []).forEach((row: any) => {
        const id = Number(row.id);
        if (!Number.isFinite(id) || id <= 0) return;
        unitByProductId.set(id, row.unit);
    });

    return unitByProductId;
}

function getRoutePath(request: Request): string {
    const pathname = new URL(request.url).pathname;
    return pathname.split('/').filter(Boolean).slice(2).join('/');
}

function routeNotFound(method: 'GET' | 'POST', routePath: string) {
    return NextResponse.json(
        {
            error: `Unknown florida ${method} route`,
            path: routePath || '(root)',
        },
        { status: 404 }
    );
}

async function fetchFloridaScopedRows(select: string) {
    const supabase = createServiceRoleClient();
    const [rows, workshopProductIds] = await Promise.all([
        fetchBranchRows(supabase, config, select),
        fetchFloridaProduction180dProductIds(supabase),
    ]);

    if (workshopProductIds.length === 0) return [];

    const allowed = new Set(workshopProductIds.map((id) => Number(id)));
    const scopedRows = rows.filter((row) => allowed.has(Number(row.productId)));
    const productIds = Array.from(
        new Set(scopedRows.map((row) => Number(row.productId)).filter((id) => Number.isFinite(id) && id > 0))
    );
    const unitByProductId = await fetchFloridaUnitMap(supabase, productIds);

    return scopedRows.map((row) => {
        const unit = normalizeFloridaUnit(unitByProductId.get(Number(row.productId)), row.productName);
        const normalized = normalizeFloridaMetrics({
            stock: row.stockNow,
            min: row.minStock,
            avg: row.avgSalesDay,
            need: row.needNet,
            unit,
            productName: row.productName,
        });

        return {
            ...row,
            stockNow: normalized.stock,
            minStock: normalized.min,
            avgSalesDay: normalized.avg,
            needNet: normalized.need,
            unit,
        };
    });
}

async function handleAnalytics() {
    const rows = await fetchFloridaScopedRows(
        'product_id, product_name, spot_name, store_id, spot_id, stock_now, min_stock, avg_sales_day, need_net'
    );

    return NextResponse.json(buildBranchAnalytics(rows, 'florida_name'));
}

async function handleShopStats(request: Request) {
    const { searchParams } = new URL(request.url);
    const productName =
        searchParams.get(config.shopParam) ||
        searchParams.get('product') ||
        searchParams.get('name');

    if (!productName) {
        return NextResponse.json(
            { error: `Query param "${config.shopParam}" is required` },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();
    const workshopProductIds = await fetchFloridaProduction180dProductIds(supabase);
    if (workshopProductIds.length === 0) {
        return NextResponse.json([]);
    }

    const { data, error } = await supabase
        .schema(config.schema)
        .from(config.distributionView)
        .select('product_id, spot_name, stock_now, min_stock, avg_sales_day, need_net')
        .in('product_id', workshopProductIds)
        .eq('product_name', productName);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unitByProductId = await fetchFloridaUnitMap(
        supabase,
        Array.from(new Set((data || []).map((row: any) => Number(row.product_id)).filter((id) => Number.isFinite(id) && id > 0)))
    );

    const normalizedRows = (data || []).map((row: any) => {
        const unit = normalizeFloridaUnit(unitByProductId.get(Number(row.product_id)), productName);
        const metrics = normalizeFloridaMetrics({
            stock: row.stock_now,
            min: row.min_stock,
            avg: row.avg_sales_day,
            need: row.need_net,
            unit,
            productName,
        });

        return {
            spot_name: row.spot_name,
            stock_now: metrics.stock,
            min_stock: metrics.min,
            avg_sales_day: metrics.avg,
            need_net: metrics.need,
            unit,
        };
    });

    return NextResponse.json(normalizedRows);
}

async function handleOrderPlan(request: Request) {
    const { searchParams } = new URL(request.url);
    const days = coercePositiveInt(searchParams.get('days'), 1, 1, 30);

    const rows = await fetchFloridaScopedRows(
        'product_id, product_name, spot_name, store_id, spot_id, stock_now, min_stock, avg_sales_day, need_net'
    );
    const unitByName = new Map<string, 'шт' | 'кг'>();
    rows.forEach((row: any) => {
        if (!row?.productName) return;
        unitByName.set(String(row.productName), normalizeFloridaUnit(row.unit, row.productName));
    });

    const plan = buildBranchOrderPlan(rows, days).map((item) => ({
        ...item,
        unit: unitByName.get(item.p_name) || normalizeFloridaUnit(undefined, item.p_name),
    }));

    return NextResponse.json(plan);
}

async function handleCalculateDistribution(request: Request) {
    const body = await request.json().catch(() => null);
    const productId = Number(body?.productId);
    const productionQuantity = Number(body?.productionQuantity);

    if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(productionQuantity)) {
        return NextResponse.json(
            { error: 'productId and productionQuantity are required' },
            { status: 400 }
        );
    }

    const rows = await fetchFloridaScopedRows(
        'product_id, product_name, spot_name, store_id, spot_id, stock_now, min_stock, avg_sales_day, need_net'
    );

    const result = calculateBranchDistribution(rows, Math.trunc(productId), productionQuantity);
    return NextResponse.json(result);
}

async function handleConfirmDistribution(request: Request) {
    const body = await request.json().catch(() => null);
    const distributions = Array.isArray(body?.distributions)
        ? body.distributions.filter(
            (item: any) =>
                Number.isFinite(Number(item?.storeId)) &&
                Number.isFinite(Number(item?.productId)) &&
                Number(item?.quantity) > 0
        )
        : [];

    const totalQty = distributions.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);

    return NextResponse.json({
        success: true,
        message: 'Distribution confirmed',
        count: distributions.length,
        totalQty,
    });
}

async function handleCreateOrder(request: Request) {
    const body = await request.json().catch(() => null);
    const orders = Array.isArray(body?.orders) ? body.orders : [];

    return NextResponse.json({
        success: true,
        message: 'Order accepted',
        ordersCount: orders.length,
    });
}

async function handleUpdateStock() {
    const supabase = createServiceRoleClient();

    const warnings: string[] = [];
    let edgeRowsFallback: FloridaEdgeStockRow[] | null = null;
    let sync: {
        synced_rows: number;
        synced_storages: number;
        skipped_storages: number[];
    } = {
        synced_rows: 0,
        synced_storages: 0,
        skipped_storages: [],
    };

    try {
        const syncResult = await syncFloridaStocksFromEdge(supabase);
        warnings.push(...syncResult.warnings);
        sync = {
            synced_rows: syncResult.syncedRows,
            synced_storages: syncResult.syncedStorages,
            skipped_storages: syncResult.skippedStorages,
        };
    } catch (err: unknown) {
        warnings.push(`DB stock sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        try {
            const edgeResult = await fetchFloridaEdgeStocks(supabase);
            warnings.push(...edgeResult.warnings);
            warnings.push('Edge read-only mode: stocks returned from edge function without DB persist.');
            edgeRowsFallback = edgeResult.rows;
            sync = {
                synced_rows: 0,
                synced_storages: edgeResult.successfulStorageIds.length,
                skipped_storages: edgeResult.skippedStorages,
            };
        } catch (edgeErr: unknown) {
            return NextResponse.json(
                { error: edgeErr instanceof Error ? edgeErr.message : 'Edge stock sync failed' },
                { status: 500 }
            );
        }
    }

    let todayManufactures: any[] = [];
    try {
        const productionSync = await syncBranchProductionFromPoster(supabase, 'florida1', 41);
        if (productionSync.warning) warnings.push(`Production snapshot warning: ${productionSync.warning}`);
        todayManufactures = productionSync.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_num: item.quantity,
        }));
    } catch (err: unknown) {
        warnings.push(`Poster unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (!Array.isArray(todayManufactures) || todayManufactures.length === 0) {
        try {
            const { data: prodRows, error: prodError } = await supabase
                .schema('florida1')
                .from('v_florida_production_only')
                .select('product_id, product_name, baked_at_factory');

            if (prodError) {
                warnings.push(`Production fallback query failed: ${prodError.message}`);
            } else {
                todayManufactures = (prodRows || []).map((row: any) => ({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    product_num: row.baked_at_factory,
                }));
            }
        } catch (err: unknown) {
            warnings.push(`Production fallback failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    const { data: storagesData, error: storagesError } = await supabase
        .schema('categories')
        .from('storages')
        .select('storage_id, storage_name');

    if (storagesError) {
        return NextResponse.json({ error: storagesError.message }, { status: 500 });
    }

    type StockSnapshotRow = {
        storage_id: number;
        ingredient_id: number | null;
        ingredient_name: string;
        stock_left: number;
        unit: string;
    };

    let stockRows: StockSnapshotRow[] = edgeRowsFallback || [];
    if (!edgeRowsFallback) {
        const { data: stocksData, error: stocksError } = await supabase
            .schema('florida1')
            .from('effective_stocks')
            .select('storage_id, ingredient_id, ingredient_name, stock_left, unit')
            .eq('source', 'poster_edge');

        if (stocksError) {
            return NextResponse.json({ error: stocksError.message }, { status: 500 });
        }
        stockRows = (stocksData || []) as StockSnapshotRow[];
    }

    const storageNameById = new Map<number, string>();
    (storagesData || []).forEach((storage: any) => {
        const storageId = Number(storage.storage_id);
        if (!Number.isFinite(storageId) || storageId <= 0) return;
        storageNameById.set(storageId, String(storage.storage_name || `Storage ${storageId}`));
    });

    const byStorage = new Map<number, any[]>();
    stockRows.forEach((row: any) => {
        const storageId = Number(row.storage_id);
        if (!Number.isFinite(storageId) || storageId <= 0) return;
        if (!byStorage.has(storageId)) byStorage.set(storageId, []);
        byStorage.get(storageId)!.push({
            ingredient_id: row.ingredient_id ?? null,
            ingredient_name: String(row.ingredient_name || ''),
            storage_ingredient_left: String(Math.max(0, Number(row.stock_left) || 0)),
            ingredient_unit: String(row.unit || ''),
        });
    });

    const allLeftovers = Array.from(byStorage.entries()).map(([storageId, leftovers]) => ({
        storage_id: String(storageId),
        storage_name: storageNameById.get(storageId) || `Storage ${storageId}`,
        leftovers,
    }));

    return NextResponse.json({
        success: true,
        data: allLeftovers,
        manufactures: todayManufactures,
        sync,
        warnings,
        timestamp: new Date().toISOString(),
    });
}

export async function GET(request: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const routePath = getRoutePath(request);

    try {
        switch (routePath) {
            case 'analytics':
                return await handleAnalytics();
            case 'shop-stats':
                return await handleShopStats(request);
            case 'order-plan':
                return await handleOrderPlan(request);
            default:
                return routeNotFound('GET', routePath);
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const routePath = getRoutePath(request);

    try {
        switch (routePath) {
            case 'calculate-distribution':
                return await handleCalculateDistribution(request);
            case 'confirm-distribution':
                return await handleConfirmDistribution(request);
            case 'create-order':
                return await handleCreateOrder(request);
            case 'update-stock':
                return await handleUpdateStock();
            default:
                return routeNotFound('POST', routePath);
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

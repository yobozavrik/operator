import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';
import { normalizeFloridaUnit } from '@/lib/florida-dictionary';
import { normalizeFloridaMetrics } from '@/lib/florida-metrics';
import { syncBranchProductionFromPoster } from '@/lib/branch-production-sync';

export const dynamic = 'force-dynamic';

interface ProductionOnlyRow {
    product_id: number;
    product_name: string;
    baked_at_factory: number;
}

interface HistoricalRow {
    product_id: number;
    product_name: string;
    total_qty_180d: number;
    prod_days: number;
    avg_qty_per_prod_day: number;
    last_manufacture_at: string | null;
}

interface MetricsRow {
    product_id: number;
    product_name: string;
    stock_now: number;
    min_stock: number;
    avg_sales_day: number;
    need_net: number;
}

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json(
                { error: 'Server Config Error', code: 'MISSING_SUPABASE_CONFIG' },
                { status: 500 }
            );
        }

        const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false },
        });

        const productionSync = await syncBranchProductionFromPoster(supabase, 'florida1', 41);
        if (productionSync.warning) {
            Logger.warn('[florida Production Detail] production snapshot warning', {
                meta: { warning: productionSync.warning },
            });
        }

        const [histRes, todayRes, metricsRes] = await Promise.all([
            supabase
                .schema('florida1')
                .from('production_180d_products')
                .select('product_id, product_name, total_qty_180d, prod_days, avg_qty_per_prod_day, last_manufacture_at')
                .order('total_qty_180d', { ascending: false }),
            supabase
                .schema('florida1')
                .from('v_florida_production_only')
                .select('product_id, product_name, baked_at_factory'),
            supabase
                .schema('florida1')
                .from('v_florida_distribution_stats')
                .select('product_id, product_name, stock_now, min_stock, avg_sales_day, need_net'),
        ]);

        if (histRes.error) {
            Logger.error('[florida Production Detail] 180d query error', { error: histRes.error.message });
            return NextResponse.json({
                error: 'Query failed',
                message: histRes.error.message,
                code: 'DB_ERROR',
            }, { status: 500 });
        }

        if (todayRes.error) {
            Logger.error('[florida Production Detail] today query error', { error: todayRes.error.message });
            return NextResponse.json({
                error: 'Query failed',
                message: todayRes.error.message,
                code: 'DB_ERROR',
            }, { status: 500 });
        }

        if (metricsRes.error) {
            Logger.error('[florida Production Detail] metrics query error', { error: metricsRes.error.message });
            return NextResponse.json({
                error: 'Query failed',
                message: metricsRes.error.message,
                code: 'DB_ERROR',
            }, { status: 500 });
        }

        const histData = (histRes.data || []) as HistoricalRow[];
        const todayData = (todayRes.data || []) as ProductionOnlyRow[];
        const metricsData = (metricsRes.data || []) as MetricsRow[];

        const productIds = Array.from(
            new Set(histData.map((row) => Number(row.product_id)).filter((id) => Number.isFinite(id) && id > 0))
        );
        const unitByProductId = new Map<number, string>();
        if (productIds.length > 0) {
            const { data: unitRows, error: unitError } = await supabase
                .schema('categories')
                .from('products')
                .select('id, unit')
                .in('id', productIds);

            if (unitError) {
                Logger.error('[florida Production Detail] product unit query error', { error: unitError.message });
            } else {
                (unitRows || []).forEach((row: any) => {
                    const id = Number(row.id);
                    if (!Number.isFinite(id) || id <= 0) return;
                    unitByProductId.set(id, row.unit);
                });
            }
        }

        const todayMap = new Map<number, ProductionOnlyRow>();
        const liveTodayRows: ProductionOnlyRow[] = productionSync.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            baked_at_factory: item.quantity,
        }));
        const todayRows = liveTodayRows.length > 0 ? liveTodayRows : todayData;
        todayRows.forEach((row) => {
            if (row?.product_id == null) return;
            todayMap.set(Number(row.product_id), row);
        });

        const metricsMap = new Map<number, { stock_now: number; min_stock: number; avg_sales_day: number; need_net: number }>();
        metricsData.forEach((row) => {
            const productId = Number(row.product_id);
            if (!Number.isFinite(productId)) return;
            const unit = normalizeFloridaUnit(unitByProductId.get(productId), row.product_name);
            const normalized = normalizeFloridaMetrics({
                stock: row.stock_now,
                min: row.min_stock,
                avg: row.avg_sales_day,
                need: row.need_net,
                unit,
                productName: row.product_name,
            });
            const current = metricsMap.get(productId) || { stock_now: 0, min_stock: 0, avg_sales_day: 0, need_net: 0 };
            current.stock_now += normalized.stock;
            current.min_stock += normalized.min;
            current.avg_sales_day += normalized.avg;
            current.need_net += normalized.need;
            metricsMap.set(productId, current);
        });

        const historicalByProduct = new Map<number, HistoricalRow>();
        histData.forEach((row) => {
            const productId = Number(row.product_id);
            if (!Number.isFinite(productId) || productId <= 0) return;
            historicalByProduct.set(productId, row);
        });

        todayMap.forEach((todayRow, productId) => {
            if (historicalByProduct.has(productId)) return;
            historicalByProduct.set(productId, {
                product_id: productId,
                product_name: todayRow.product_name,
                total_qty_180d: 0,
                prod_days: 0,
                avg_qty_per_prod_day: 0,
                last_manufacture_at: null,
            });
        });

        const merged = Array.from(historicalByProduct.values()).map((row) => {
            const productId = Number(row.product_id);
            const today = todayMap.get(productId);
            const metrics = metricsMap.get(productId);

            return {
                product_id: productId,
                product_name: row.product_name,
                baked_at_factory: Number(today?.baked_at_factory || 0),
                total_qty_180d: Number(row.total_qty_180d || 0),
                prod_days: Number(row.prod_days || 0),
                avg_qty_per_prod_day: Number(row.avg_qty_per_prod_day || 0),
                last_manufacture_at: row.last_manufacture_at,
                stock_now: Number(metrics?.stock_now || 0),
                min_stock: Number(metrics?.min_stock || 0),
                avg_sales_day: Number(metrics?.avg_sales_day || 0),
                need_net: Number(metrics?.need_net || 0),
            };
        });

        merged.sort((a, b) => {
            if (b.baked_at_factory !== a.baked_at_factory) return b.baked_at_factory - a.baked_at_factory;
            return b.total_qty_180d - a.total_qty_180d;
        });

        return NextResponse.json(merged);
    } catch (err: any) {
        Logger.error('[florida Production Detail] Critical Error', { error: err.message });
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message,
            code: 'INTERNAL_ERROR',
        }, { status: 500 });
    }
}

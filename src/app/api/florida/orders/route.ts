import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';
import { fetchFloridaProduction180dProductIds } from '@/lib/florida-production-180d';
import { normalizeFloridaUnit } from '@/lib/florida-dictionary';
import { normalizeFloridaMetrics } from '@/lib/florida-metrics';
import { fetchFloridaEdgeStocks, syncFloridaStocksFromEdge } from '@/lib/florida-stock-sync';
import { createServiceRoleClient } from '@/lib/branch-api';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FloridaEdgeStockRow } from '@/lib/florida-stock-sync';
import { syncBranchProductionFromPoster } from '@/lib/branch-production-sync';

export const dynamic = 'force-dynamic';

type DistributionRow = {
    product_id: number;
    product_name: string;
    spot_name: string;
    stock_now: number;
    min_stock: number;
    avg_sales_day: number;
    need_net: number;
    [key: string]: unknown;
};

async function fetchDistributionRows(
    supabase: SupabaseClient,
    workshopProductIds: number[]
): Promise<DistributionRow[]> {
    const { data, error } = await supabase
        .schema('florida1')
        .from('v_florida_distribution_stats')
        .select('product_id, product_name, spot_name, stock_now, min_stock, avg_sales_day, need_net')
        .in('product_id', workshopProductIds);

    if (error) {
        throw new Error(error.message);
    }

    return (Array.isArray(data) ? data : []) as DistributionRow[];
}

function normalizeJoinKey(value: unknown): string {
    return String(value || '')
        .toLowerCase()
        .replace(/[^а-яіїєґa-z0-9]/g, '');
}

function applyEdgeStocksToRows(rows: DistributionRow[], edgeRows: FloridaEdgeStockRow[]): DistributionRow[] {
    const stockBySpotProduct = new Map<string, number>();

    edgeRows.forEach((edgeRow) => {
        const spotKey = normalizeJoinKey(edgeRow.spot_name);
        const productKey = normalizeJoinKey(edgeRow.ingredient_name);
        if (!spotKey || !productKey) return;
        const stock = Math.max(0, Number(edgeRow.stock_left) || 0);
        const key = `${spotKey}::${productKey}`;
        stockBySpotProduct.set(key, (stockBySpotProduct.get(key) || 0) + stock);
    });

    return rows.map((row) => {
        const key = `${normalizeJoinKey(row.spot_name)}::${normalizeJoinKey(row.product_name)}`;
        if (!stockBySpotProduct.has(key)) return row;
        return {
            ...row,
            stock_now: stockBySpotProduct.get(key) || 0,
        };
    });
}

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const supabase = createServiceRoleClient();
        await syncBranchProductionFromPoster(supabase, 'florida1', 41).catch((error) => {
            Logger.error('Florida live production sync failed in /orders', { error: String(error) });
            return null;
        });

        const workshopProductIds = await fetchFloridaProduction180dProductIds(supabase);
        if (workshopProductIds.length === 0) {
            return NextResponse.json([]);
        }

        let rows = await fetchDistributionRows(supabase, workshopProductIds);

        const hasPositiveStock = rows.some((row: Record<string, unknown>) => Number(row.stock_now) > 0);
        if (!hasPositiveStock) {
            try {
                const syncResult = await syncFloridaStocksFromEdge(supabase);
                Logger.info('Florida edge stock sync from /orders', {
                    meta: {
                        syncedRows: syncResult.syncedRows,
                        syncedStorages: syncResult.syncedStorages,
                        skippedStorages: syncResult.skippedStorages,
                        warnings: syncResult.warnings,
                    },
                });
                rows = await fetchDistributionRows(supabase, workshopProductIds);
            } catch (syncError) {
                Logger.error('Florida edge stock sync failed in /orders', { error: String(syncError) });
                try {
                    const edgeResult = await fetchFloridaEdgeStocks(supabase);
                    rows = applyEdgeStocksToRows(rows, edgeResult.rows);
                    Logger.info('Florida /orders switched to edge read-only stock overlay', {
                        meta: {
                            edgeRows: edgeResult.rows.length,
                            warnings: edgeResult.warnings,
                        },
                    });
                } catch (edgeFallbackError) {
                    Logger.error('Florida edge read-only fallback failed in /orders', {
                        error: String(edgeFallbackError),
                    });
                }
            }
        }

        const unitByProductId = new Map<number, string>();
        const productIdsFromRows = Array.from(
            new Set(
                rows
                    .map((row: Record<string, unknown>) => Number(row.product_id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            )
        );

        if (productIdsFromRows.length > 0) {
            const { data: productUnits, error: unitsError } = await supabase
                .schema('categories')
                .from('products')
                .select('id, unit')
                .in('id', productIdsFromRows);

            if (unitsError) {
                Logger.error('Florida products unit query error', { error: unitsError.message });
            } else {
                (productUnits || []).forEach((row: Record<string, unknown>) => {
                    const id = Number(row.id);
                    if (!Number.isFinite(id) || id <= 0) return;
                    unitByProductId.set(id, normalizeFloridaUnit(String(row.unit || '')));
                });
            }
        }

        const enrichedData = rows.map((row: Record<string, unknown>) => {
            const productId = Number(row.product_id);
            const unitFromCatalog = Number.isFinite(productId) ? unitByProductId.get(productId) : undefined;
            const productName = String(row.product_name || '');
            const unit = normalizeFloridaUnit(unitFromCatalog || String(row.unit || ''), productName);
            const normalized = normalizeFloridaMetrics({
                stock: row.stock_now,
                min: row.min_stock,
                avg: row.avg_sales_day,
                need: row.need_net,
                unit,
                productName,
            });

            return {
                ...row,
                unit,
                stock_now: normalized.stock,
                min_stock: normalized.min,
                avg_sales_day: normalized.avg,
                need_net: normalized.need,
            };
        });

        return NextResponse.json(enrichedData);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        Logger.error('Critical Florida API Error', { error: message });
        return NextResponse.json({
            error: 'Internal Server Error',
            message,
        }, { status: 500 });
    }
}

import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import {
    BRANCH_CONFIGS,
    calculateBranchDistribution,
    createServiceRoleClient,
    fetchBranchRows,
    type NormalizedDistributionRow,
} from '@/lib/branch-api';
import { applyBulvarMinStockPolicyToNormalizedRows } from '@/lib/bulvar-min-stock-policy';
import { syncBranchProductionFromPoster, type BranchProductionItem } from '@/lib/branch-production-sync';

export const dynamic = 'force-dynamic';

const config = BRANCH_CONFIGS.bulvar;

function toPositiveInt(value: unknown): number {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.max(0, Math.floor(raw));
}

function getKyivBusinessDate(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
}

async function countTodayDistributionRows(supabaseAdmin: SupabaseClient): Promise<number> {
    const { count, error } = await supabaseAdmin
        .schema('bulvar1')
        .from('v_bulvar_today_distribution')
        .select('id', { count: 'exact', head: true });

    if (error) return 0;
    return Number(count || 0);
}

async function runPosterFallbackDistribution(
    supabaseAdmin: SupabaseClient,
    liveProduction: BranchProductionItem[]
) {
    const serviceClient = createServiceRoleClient();
    const [rawRows, catalogRes] = await Promise.all([
        fetchBranchRows(
            serviceClient,
            config,
            'product_id, product_name, spot_name, store_id, spot_id, stock_now, min_stock, avg_sales_day, need_net'
        ),
        supabaseAdmin
            .schema('bulvar1')
            .from('production_180d_products')
            .select('product_id'),
    ]);

    if (catalogRes.error) {
        throw new Error(`Failed to read bulvar production catalog: ${catalogRes.error.message}`);
    }

    const catalogProductIds = new Set(
        (catalogRes.data || [])
            .map((row: Record<string, unknown>) => Number(row.product_id))
            .filter((id) => Number.isFinite(id) && id > 0)
    );

    liveProduction.forEach((item) => {
        const id = Number(item.product_id);
        if (Number.isFinite(id) && id > 0) catalogProductIds.add(id);
    });

    const normalizedRows = applyBulvarMinStockPolicyToNormalizedRows(rawRows as any[]) as NormalizedDistributionRow[];
    const rows = normalizedRows.filter((row) => catalogProductIds.has(Number(row.productId)));
    if (rows.length === 0) {
        return { batchId: crypto.randomUUID(), insertedRows: 0, productsWithProduction: 0 };
    }

    const productNameById = new Map<number, string>();
    const storeNameById = new Map<number, string>();
    rows.forEach((row) => {
        productNameById.set(row.productId, row.productName);
        storeNameById.set(row.storeId, row.storeName);
    });

    const productionByProductId = new Map<number, number>();
    liveProduction.forEach((item) => {
        const productId = Number(item.product_id);
        if (!Number.isFinite(productId) || productId <= 0) return;
        if (!catalogProductIds.has(productId)) return;
        const qty = toPositiveInt(item.quantity);
        if (qty <= 0) return;
        productionByProductId.set(productId, (productionByProductId.get(productId) || 0) + qty);
    });

    const batchId = crypto.randomUUID();
    const businessDate = getKyivBusinessDate();
    const insertRows: Array<{
        product_name: string;
        spot_name: string;
        quantity_to_ship: number;
        calculation_batch_id: string;
        business_date: string;
        delivery_status: string;
    }> = [];

    for (const [productId, qty] of productionByProductId.entries()) {
        if (qty <= 0) continue;

        const calc = calculateBranchDistribution(rows, productId, qty);
        const productName = productNameById.get(productId) || `Product ${productId}`;
        Object.entries(calc.distributed).forEach(([storeIdRaw, shipQtyRaw]) => {
            const shipQty = toPositiveInt(shipQtyRaw);
            if (shipQty <= 0) return;
            const storeId = Number(storeIdRaw);
            insertRows.push({
                product_name: productName,
                spot_name: storeNameById.get(storeId) || `Store ${storeId}`,
                quantity_to_ship: shipQty,
                calculation_batch_id: batchId,
                business_date: businessDate,
                delivery_status: 'pending',
            });
        });

        if (calc.remaining > 0) {
            insertRows.push({
                product_name: productName,
                spot_name: 'Остаток на Складе',
                quantity_to_ship: toPositiveInt(calc.remaining),
                calculation_batch_id: batchId,
                business_date: businessDate,
                delivery_status: 'delivered',
            });
        }
    }

    const { error: deleteError } = await supabaseAdmin
        .schema('bulvar1')
        .from('distribution_results')
        .delete()
        .eq('business_date', businessDate);

    if (deleteError) {
        throw new Error(`Failed to clear old Bulvar distribution: ${deleteError.message}`);
    }

    if (insertRows.length > 0) {
        const { error: insertError } = await supabaseAdmin
            .schema('bulvar1')
            .from('distribution_results')
            .insert(insertRows);
        if (insertError) {
            throw new Error(`Failed to save Bulvar distribution fallback: ${insertError.message}`);
        }
    }

    return {
        batchId,
        insertedRows: insertRows.length,
        productsWithProduction: productionByProductId.size,
    };
}

export async function POST() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        return NextResponse.json({ error: 'Server Config Error: Missing Supabase credentials' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false }
    });

    try {
        const productionSync = await syncBranchProductionFromPoster(supabaseAdmin, 'bulvar1', 22);
        const { data: batchId, error: runError } = await supabaseAdmin
            .schema('bulvar1')
            .rpc('fn_full_recalculate_all');

        if (runError) {
            if (runError.code === '55P03' || runError.message?.toLowerCase().includes('already running')) {
                return NextResponse.json({ error: 'Calculation is already running' }, { status: 409 });
            }

            const fallback = await runPosterFallbackDistribution(supabaseAdmin, productionSync.items);
            return NextResponse.json({
                success: true,
                batch_id: fallback.batchId,
                mode: 'poster_fallback_after_rpc_error',
                message: 'SQL-розрахунок недоступний, застосовано live-fallback з Poster.',
                fallback_rows: fallback.insertedRows,
                fallback_products: fallback.productsWithProduction,
                rpc_error: runError.message,
            });
        }

        if (!batchId) {
            return NextResponse.json({ error: 'Empty batch id returned by fn_full_recalculate_all' }, { status: 500 });
        }

        const todayRows = await countTodayDistributionRows(supabaseAdmin);
        if (todayRows <= 0) {
            const fallback = await runPosterFallbackDistribution(supabaseAdmin, productionSync.items);
            if (fallback.insertedRows > 0) {
                return NextResponse.json({
                    success: true,
                    batch_id: fallback.batchId,
                    mode: 'poster_fallback_after_empty_sql',
                    message: `SQL дав 0 рядків, застосовано live-fallback (${fallback.insertedRows} рядків).`,
                    fallback_rows: fallback.insertedRows,
                    fallback_products: fallback.productsWithProduction,
                });
            }
        }

        const { data: batchRows, error: summaryError } = await supabaseAdmin
            .schema('bulvar1')
            .from('distribution_results')
            .select('product_name, quantity_to_ship')
            .eq('calculation_batch_id', batchId);

        if (summaryError) {
            throw summaryError;
        }

        const safeRows = batchRows || [];
        const productsProcessed = new Set(safeRows.map(row => row.product_name)).size;
        const totalKg = safeRows.reduce((acc, row) => acc + (Number(row.quantity_to_ship) || 0), 0);

        return NextResponse.json({
            success: true,
            batch_id: batchId,
            products_processed: productsProcessed,
            total_kg: totalKg,
            message: `Batch: ${String(batchId).slice(0, 8)} | Позицій: ${productsProcessed} | Вага: ${totalKg} кг`
        });

    } catch (err: unknown) {
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Unknown distribution error',
        }, { status: 500 });
    }
}

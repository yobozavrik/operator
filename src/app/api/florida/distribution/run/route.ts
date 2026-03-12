import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import crypto from 'crypto';
import { getTodayManufactures } from '@/lib/poster-api';
import {
    BRANCH_CONFIGS,
    calculateBranchDistribution,
    createServiceRoleClient,
    fetchBranchRows,
    type NormalizedDistributionRow,
} from '@/lib/branch-api';
import { fetchFloridaProduction180dProductIds } from '@/lib/florida-production-180d';
import { syncBranchProductionFromPoster, type BranchProductionItem } from '@/lib/branch-production-sync';

export const dynamic = 'force-dynamic';

function normalizeProductName(value: string): string {
    return String(value || '')
        .toLowerCase()
        .replace(/[^а-яіїєґa-z0-9]/g, '');
}

function toPositiveInt(value: unknown): number {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.max(0, Math.floor(raw));
}

async function countTodayDistributionRows(supabaseAdmin: SupabaseClient): Promise<number> {
    const { count, error } = await supabaseAdmin
        .schema('florida1')
        .from('v_florida_today_distribution')
        .select('id', { count: 'exact', head: true });

    if (error) return 0;
    return Number(count || 0);
}

async function runPosterFallbackDistribution(
    supabaseAdmin: SupabaseClient,
    liveProduction?: BranchProductionItem[]
) {
    const serviceClient = createServiceRoleClient();
    const config = BRANCH_CONFIGS.florida;

    const [rawRows, workshopProductIds] = await Promise.all([
        fetchBranchRows(
            serviceClient,
            config,
            'product_id, product_name, spot_name, store_id, spot_id, stock_now, min_stock, avg_sales_day, need_net'
        ),
        fetchFloridaProduction180dProductIds(serviceClient),
    ]);

    const todayManufactures = liveProduction
        ? liveProduction.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_num: item.quantity,
        }))
        : await getTodayManufactures({ categoryKeywords: null, storageId: 41 });

    const allowedProductIds = new Set(workshopProductIds.map((id) => Number(id)));
    const rows = rawRows.filter((row) => allowedProductIds.has(Number(row.productId)));

    if (rows.length === 0) {
        return { batchId: crypto.randomUUID(), insertedRows: 0, productsWithProduction: 0 };
    }

    const productNameById = new Map<number, string>();
    const productIdByNormalizedName = new Map<string, number>();
    const storeNameById = new Map<number, string>();

    rows.forEach((row) => {
        productNameById.set(row.productId, row.productName);
        storeNameById.set(row.storeId, row.storeName);

        const normalized = normalizeProductName(row.productName);
        if (normalized && !productIdByNormalizedName.has(normalized)) {
            productIdByNormalizedName.set(normalized, row.productId);
        }
    });

    const productionByProductId = new Map<number, number>();
    (todayManufactures || []).forEach((item: Record<string, unknown>) => {
        const rawName = String(item?.product_name || item?.ingredient_name || '').trim();
        const productIdRaw = Number(item?.product_id);
        const quantityRaw = item?.product_num ?? item?.quantity ?? item?.num ?? item?.amount;
        const quantity = toPositiveInt(quantityRaw);

        if (quantity <= 0) return;

        let resolvedProductId: number | null = null;

        if (Number.isFinite(productIdRaw) && productIdRaw > 0 && allowedProductIds.has(productIdRaw)) {
            resolvedProductId = productIdRaw;
        } else if (rawName) {
            const byName = productIdByNormalizedName.get(normalizeProductName(rawName));
            if (byName && allowedProductIds.has(byName)) {
                resolvedProductId = byName;
            }
        }

        if (!resolvedProductId) return;

        productionByProductId.set(
            resolvedProductId,
            (productionByProductId.get(resolvedProductId) || 0) + quantity
        );
    });

    const batchId = crypto.randomUUID();
    const businessDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());

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

        const calc = calculateBranchDistribution(rows as NormalizedDistributionRow[], productId, qty);
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
        .schema('florida1')
        .from('distribution_results')
        .delete()
        .eq('business_date', businessDate);

    if (deleteError) {
        throw new Error(`Failed to clear old Florida distribution: ${deleteError.message}`);
    }

    if (insertRows.length > 0) {
        const { error: insertError } = await supabaseAdmin
            .schema('florida1')
            .from('distribution_results')
            .insert(insertRows);

        if (insertError) {
            throw new Error(`Failed to save Florida distribution fallback: ${insertError.message}`);
        }
    }

    return {
        batchId,
        insertedRows: insertRows.length,
        productsWithProduction: productionByProductId.size,
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    console.log('Starting Florida distribution...');

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return NextResponse.json({ error: 'Server Config Error: Missing Key' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
    );

    try {
        const productionSync = await syncBranchProductionFromPoster(supabaseAdmin, 'florida1', 41);
        console.log(`🚀 Sending RPC command...`);

        const { data: logId, error } = await supabaseAdmin
            .schema('florida1')
            .rpc('fn_full_recalculate_all');

        if (error) {
            console.error('❌ RPC Error:', error);

            if (error.code === '55P03' || error.message.includes('progress')) {
                return NextResponse.json({ error: 'Calculation is already running' }, { status: 409 });
            }

            // SQL recalculation failed: try live Poster fallback so logistics dashboard keeps working.
            const fallback = await runPosterFallbackDistribution(supabaseAdmin, productionSync.items);
            return NextResponse.json({
                success: true,
                logId: fallback.batchId,
                mode: 'poster_fallback_after_rpc_error',
                message: 'SQL-розрахунок недоступний, застосовано live-fallback з Poster.',
                fallback_rows: fallback.insertedRows,
                fallback_products: fallback.productsWithProduction,
                rpc_error: error.message,
            });
        }

        const todayRows = await countTodayDistributionRows(supabaseAdmin);
        if (todayRows > 0) {
            console.log(`✅ SUCCESS! Log ID: ${logId}`);
            return NextResponse.json({
                success: true,
                logId,
                mode: 'sql_distribution',
                rows: todayRows,
                message: `Розподіл сформовано (${todayRows} рядків).`,
            });
        }

        // SQL completed but produced no rows: fallback to Poster live production for today.
        try {
            const fallback = await runPosterFallbackDistribution(supabaseAdmin, productionSync.items);

            if (fallback.insertedRows > 0) {
                console.log(`✅ SUCCESS! Log ID: ${logId}`);
                return NextResponse.json({
                    success: true,
                    logId: fallback.batchId || logId,
                    mode: 'poster_fallback_after_empty_sql',
                    message: `SQL дав 0 рядків, застосовано live-fallback (${fallback.insertedRows} рядків).`,
                    fallback_rows: fallback.insertedRows,
                    fallback_products: fallback.productsWithProduction,
                });
            }

            return NextResponse.json({
                success: true,
                logId,
                mode: 'sql_empty_no_production',
                rows: 0,
                message: 'На сьогодні у Florida немає випуску для розподілу.',
            });
        } catch (fallbackErr: unknown) {
            const fallbackMessage =
                fallbackErr instanceof Error ? fallbackErr.message : 'Unknown fallback error';

            return NextResponse.json({
                success: true,
                logId,
                mode: 'sql_empty_fallback_failed',
                rows: 0,
                warning: fallbackMessage,
                message: 'SQL дав 0 рядків, fallback тимчасово недоступний.',
            });
        }

    } catch (err: unknown) {
        console.error('❌ API Error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


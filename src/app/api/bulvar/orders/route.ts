import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';
import { mergeWithPosterLiveStock } from '@/lib/poster-merger';
import { applyBulvarMinStockPolicyToRawRows } from '@/lib/bulvar-min-stock-policy';
import { syncBranchProductionFromPoster } from '@/lib/branch-production-sync';

export const dynamic = 'force-dynamic';

async function refreshBulvarProductionCatalog(supabase: SupabaseClient) {
    const { error } = await supabase
        .schema('bulvar1')
        .rpc('refresh_production_180d_products', { p_product_ids: null });

    if (error) {
        Logger.error('[bulvar Orders API] production_180d refresh failed', { error: error.message });
    }
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

        // Keep Bulvar product catalog self-updated from workshop production before reading cards.
        await refreshBulvarProductionCatalog(supabase);

        const productionSync = await syncBranchProductionFromPoster(supabase, 'bulvar1', 22).catch((error) => {
            Logger.error('[bulvar Orders API] live production sync failed', { error: String(error) });
            return null;
        });

        const liveTodayPosterProductIds = Array.from(
            new Set(
                (productionSync?.items || [])
                    .map((item) => Number(item.product_id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            )
        );

        const { data: workshopProducts, error: workshopError } = await supabase
            .schema('bulvar1')
            .from('production_180d_products')
            .select('product_id');

        if (workshopError) {
            Logger.error('[bulvar Orders API] Workshop products query failed', { error: workshopError.message });
            return NextResponse.json({
                error: 'Database query failed',
                message: workshopError.message,
                code: 'DB_ERROR'
            }, { status: 500 });
        }

        const workshopProductIds = Array.from(
            new Set([
                ...(workshopProducts || []).map((row) => Number(row.product_id)),
                ...liveTodayPosterProductIds,
            ].filter((id) => Number.isFinite(id) && id > 0))
        );

        if (workshopProductIds.length === 0) {
            return NextResponse.json([]);
        }

        const { data, error } = await supabase
            .schema('bulvar1')
            .from('v_bulvar_distribution_stats')
            .select('product_id, product_name, spot_name, stock_now, min_stock, avg_sales_day, need_net')
            .in('product_id', workshopProductIds);

        if (error) {
            Logger.error('[bulvar Orders API] Supabase error', { error: error.message });
            return NextResponse.json({
                error: 'Database query failed',
                message: error.message,
                code: 'DB_ERROR'
            }, { status: 500 });
        }

        let mergedData = data || [];
        try {
            mergedData = await mergeWithPosterLiveStock(data as any[], {
                categoryKeywords: null, // Bulvar needs factual leftovers for all products
                convertKgToGrams: false,
            });
        } catch (posterErr) {
            Logger.error('[bulvar Orders API] Poster merge failed', { error: String(posterErr) });
        }

        const policyAdjustedData = applyBulvarMinStockPolicyToRawRows(mergedData as any[]);

        return NextResponse.json(policyAdjustedData);

    } catch (err: any) {
        Logger.error('[bulvar Orders API] Critical Error', { error: err.message || String(err) });
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message || 'An unexpected error occurred',
            code: 'INTERNAL_ERROR'
        }, { status: 500 });
    }
}

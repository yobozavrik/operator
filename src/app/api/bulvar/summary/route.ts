import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-guard';
import { calcBulvarMinStock } from '@/lib/bulvar-min-stock-policy';
import { createServiceRoleClient } from '@/lib/branch-api';
import { syncBranchProductionFromPoster } from '@/lib/branch-production-sync';

export const dynamic = 'force-dynamic';

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        let liveTotalBaked: number | null = null;
        try {
            const serviceClient = createServiceRoleClient();
            const syncResult = await syncBranchProductionFromPoster(serviceClient, 'bulvar1', 22);
            liveTotalBaked = syncResult.totalQty;
        } catch {
            // Fallback to DB summary values if live Poster sync is unavailable.
        }

        const [{ data: summaryData, error: summaryError }, { data: statRows, error: statsError }] = await Promise.all([
            supabase
                .schema('bulvar1')
                .from('v_bulvar_summary_stats')
                .select('total_baked')
                .single(),
            supabase
                .schema('bulvar1')
                .from('v_bulvar_distribution_stats')
                .select('avg_sales_day, stock_now')
        ]);

        if (summaryError || statsError) {
            console.error('[bulvar Summary] Supabase error:', summaryError || statsError);
            // Return 0 values to prevent frontend crash
            return NextResponse.json({ total_baked: 0, total_norm: 0, total_need: 0 });
        }

        const adjusted = (statRows || []).reduce(
            (acc, row: any) => {
                const avg = Number(row.avg_sales_day) || 0;
                const stock = Math.max(0, Number(row.stock_now) || 0);
                const min = calcBulvarMinStock(avg);
                const need = Math.max(0, min - stock);

                acc.total_norm += min * 2;
                acc.total_need += need;
                return acc;
            },
            { total_norm: 0, total_need: 0 }
        );

        return NextResponse.json({
            total_baked: liveTotalBaked ?? (Number(summaryData?.total_baked) || 0),
            total_norm: adjusted.total_norm,
            total_need: adjusted.total_need,
        });
    } catch (error) {
        console.error('[bulvar Summary] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

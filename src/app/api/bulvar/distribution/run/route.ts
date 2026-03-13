import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { syncBranchProductionFromPoster, type BranchProductionItem } from '@/lib/branch-production-sync';
import { syncBulvarStocksFromEdge } from '@/lib/bulvar-stock-sync';

export const dynamic = 'force-dynamic';

function toPositiveInt(value: unknown): number {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.max(0, Math.floor(raw));
}

async function countTodayDistributionRows(supabaseAdmin: SupabaseClient): Promise<number> {
    const { count, error } = await supabaseAdmin
        .schema('bulvar1')
        .from('v_bulvar_today_distribution')
        .select('id', { count: 'exact', head: true });

    if (error) return 0;
    return Number(count || 0);
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
        try {
            await syncBulvarStocksFromEdge(supabaseAdmin);
        } catch {
            // Keep SQL distribution path resilient: it can still run on the last persisted stock snapshot.
        }

        const { data: batchId, error: runError } = await supabaseAdmin
            .schema('bulvar1')
            .rpc('fn_full_recalculate_all');

        if (runError) {
            if (runError.code === '55P03' || runError.message?.toLowerCase().includes('already running')) {
                return NextResponse.json({ error: 'Calculation is already running' }, { status: 409 });
            }
            return NextResponse.json({
                error: 'Bulvar SQL distribution failed',
                message: runError.message,
                code: 'SQL_DISTRIBUTION_ERROR',
            }, { status: 500 });
        }

        if (!batchId) {
            return NextResponse.json({ error: 'Empty batch id returned by fn_full_recalculate_all' }, { status: 500 });
        }

        const todayRows = await countTodayDistributionRows(supabaseAdmin);
        if (todayRows <= 0 && productionSync.items.length > 0) {
            return NextResponse.json({
                error: 'Bulvar SQL distribution produced 0 rows',
                code: 'EMPTY_SQL_RESULT',
            }, { status: 500 });
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
            mode: 'sql_only',
            products_processed: productsProcessed,
            total_qty: totalKg,
            message: `Batch: ${String(batchId).slice(0, 8)} | Позицій: ${productsProcessed} | Обсяг: ${totalKg}`
        });

    } catch (err: unknown) {
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Unknown distribution error',
        }, { status: 500 });
    }
}

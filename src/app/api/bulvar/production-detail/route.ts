import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';

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

        const [{ data: histData, error: histError }, { data: todayData, error: todayError }] = await Promise.all([
            supabase
                .schema('bulvar1')
                .from('production_180d_products')
                .select('product_id, product_name, total_qty_180d, prod_days, avg_qty_per_prod_day, last_manufacture_at')
                .order('total_qty_180d', { ascending: false }),
            supabase
                .schema('bulvar1')
                .from('v_bulvar_production_only')
                .select('product_id, product_name, baked_at_factory')
        ]);

        if (histError) {
            Logger.error('[bulvar Production Detail] 180d query error', { error: histError.message });
            return NextResponse.json({
                error: 'Query failed',
                message: histError.message,
                code: 'DB_ERROR'
            }, { status: 500 });
        }

        if (todayError) {
            Logger.error('[bulvar Production Detail] today query error', { error: todayError.message });
            return NextResponse.json({
                error: 'Query failed',
                message: todayError.message,
                code: 'DB_ERROR'
            }, { status: 500 });
        }

        const todayMap = new Map<number, ProductionOnlyRow>();
        (todayData || []).forEach((row) => {
            if (row?.product_id != null) {
                todayMap.set(Number(row.product_id), row as ProductionOnlyRow);
            }
        });

        const merged = (histData || []).map((row) => {
            const histRow = row as HistoricalRow;
            const today = todayMap.get(Number(histRow.product_id));
            return {
                product_id: histRow.product_id,
                product_name: histRow.product_name,
                baked_at_factory: Number(today?.baked_at_factory || 0),
                total_qty_180d: Number(histRow.total_qty_180d || 0),
                prod_days: Number(histRow.prod_days || 0),
                avg_qty_per_prod_day: Number(histRow.avg_qty_per_prod_day || 0),
                last_manufacture_at: histRow.last_manufacture_at,
            };
        });

        merged.sort((a, b) => {
            if (b.baked_at_factory !== a.baked_at_factory) return b.baked_at_factory - a.baked_at_factory;
            return b.total_qty_180d - a.total_qty_180d;
        });

        return NextResponse.json(merged);

    } catch (err: any) {
        Logger.error('[bulvar Production Detail] Critical Error', { error: err.message });
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message,
            code: 'INTERNAL_ERROR'
        }, { status: 500 });
    }
}

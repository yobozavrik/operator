import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-guard';

/**
 * GET /api/pizza/distribution-stats
 * Fetches distribution statistics from v_pizza_distribution_stats view
 */
export async function GET(request: NextRequest) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        let query = supabase
            .from('v_pizza_distribution_stats')
            .select('*');

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Distribution Stats] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('[Distribution Stats] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        // Query the dedicated summary view
        const { data, error } = await supabase
            .from('v_pizza_summary_stats')
            .select('total_baked, total_norm, total_need')
            .single();

        if (error) {
            console.error('[Pizza Summary] Supabase error:', error);
            // Return 0 values to prevent frontend crash
            return NextResponse.json({ total_baked: 0, total_norm: 0, total_need: 0 });
        }

        return NextResponse.json(data || { total_baked: 0, total_norm: 0, total_need: 0 });
    } catch (error) {
        console.error('[Pizza Summary] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

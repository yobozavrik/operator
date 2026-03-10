import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { data, error } = await supabase
            .schema('bulvar1').from('v_bulvar_production_only')
            .select('product_name, baked_at_factory')
            .order('baked_at_factory', { ascending: false });

        if (error) {
            console.error('[bulvar Production Detail] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('[bulvar Production Detail] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

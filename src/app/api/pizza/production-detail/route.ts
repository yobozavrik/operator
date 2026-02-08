import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('v_pizza_production_only')
            .select('product_name, baked_at_factory')
            .order('baked_at_factory', { ascending: false });

        if (error) {
            console.error('[Pizza Production Detail] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('[Pizza Production Detail] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

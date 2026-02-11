import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const pizza = searchParams.get('pizza');

    if (!pizza) {
        return NextResponse.json({ error: 'Pizza name is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('v_pizza_distribution_stats')
            .select('spot_name, stock_now, min_stock, avg_sales_day')
            .eq('product_name', pizza);

        if (error) {
            console.error('Database Error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

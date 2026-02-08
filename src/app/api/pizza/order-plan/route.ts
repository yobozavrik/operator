import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '1');

    try {
        const { data, error } = await supabase.rpc('f_generate_order_plan', { p_days: days });

        if (error) {
            console.error('RPC Error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

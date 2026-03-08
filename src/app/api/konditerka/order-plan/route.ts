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
    const days = parseInt(searchParams.get('days') || '1');

    try {
        // NEW: Dedicated Konditerka multi-day algorithm (replaces the borrowed Pizza algorithm)
        const { data, error } = await supabase.rpc('f_generate_order_plan_konditerka', { p_days: days });

        if (error) {
            console.error('Konditerka Order Plan Error:', error.message);
            // In case RPC isn't deployed yet, fall back to empty array to prevent crash
            if (error.code === '42883' || error.message.includes('No function matches')) return NextResponse.json([]);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    console.log('Starting bulvar distribution...');

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return NextResponse.json({ error: 'Server Config Error: Missing Key' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
    );

    try {
        console.log(`🚀 Sending RPC command...`);

        const { data: logId, error } = await supabaseAdmin
            .schema('bulvar1')
            .rpc('fn_full_recalculate_all');

        if (error) {
            console.error('❌ RPC Error:', error);

            if (error.code === '55P03' || error.message.includes('progress')) {
                return NextResponse.json({ error: 'Calculation is already running' }, { status: 409 });
            }
            if (error.message.includes('Data Integrity Error')) {
                return NextResponse.json({ error: 'Validation Failed: Zero products distributed.' }, { status: 422 });
            }
            throw error;
        }

        console.log(`✅ SUCCESS! Log ID: ${logId}`);
        return NextResponse.json({ success: true, logId });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('❌ API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


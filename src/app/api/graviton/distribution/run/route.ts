import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

export const maxDuration = 300; // 5 minutes timeout for Vercel/Next.js

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        console.log('[Graviton] Starting distribution calculation...');

        // Initialize Supabase Client with Service Role Key
        // This gives us "admin" privileges and bypasses RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        // Call the RPC function
        // We use the admin client to ensure we have permission and better timeout handling
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data, error } = await supabaseAdmin.rpc('fn_run_graviton_calc');

        if (error) {
            console.error('[Graviton] RPC Error:', error);
            return NextResponse.json(
                { error: error.message, details: error },
                { status: 500 }
            );
        }

        console.log('[Graviton] Distribution completed successfully');
        return NextResponse.json({ success: true, message: 'Розподіл успішно завершено' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('[Graviton] Internal Server Error:', err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: err.message },
            { status: 500 }
        );
    }
}

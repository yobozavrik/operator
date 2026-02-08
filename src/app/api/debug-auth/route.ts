import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
        url: url,
        anonKeyLength: anonKey ? anonKey.length : 'MISSING',
        serviceKeyLength: serviceKey ? serviceKey.length : 'MISSING',
        keysAreDifferent: anonKey !== serviceKey,
        serviceKeyPrefix: serviceKey ? serviceKey.substring(0, 10) + '...' : 'N/A',
        isHttps: url?.startsWith('https')
    });
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import https from 'https'

export async function createClient() {
    const cookieStore = await cookies()

    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 🔐 AUTO-FIX: Force HTTP if using self-signed VPS domain to bypass Vercel SSL rejection
    if (supabaseUrl?.includes('dmytrotovstytskyi.online') && supabaseUrl.startsWith('https://')) {
        supabaseUrl = supabaseUrl.replace('https://', 'http://');
        console.log('🔄 Protocol downgraded to HTTP for SSL bypass:', supabaseUrl);
    }

    // 🔐 Bypass SSL verification for self-hosted Supabase with self-signed certs
    if (supabaseUrl?.includes('dmytrotovstytskyi.online')) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        console.log('🔓 SSL Verification disabled for:', supabaseUrl);
    }

    return createServerClient(
        supabaseUrl || 'http://missing-server-url.supabase.co',
        supabaseAnonKey || 'missing-server-key',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            }
        }
    )
}

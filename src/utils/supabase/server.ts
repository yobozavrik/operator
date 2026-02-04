import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import https from 'https'

export async function createClient() {
    const cookieStore = await cookies()

    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey

    const allowInsecureHttp = process.env.SUPABASE_ALLOW_INSECURE_HTTP === 'true'

    // 🔐 Optional HTTP downgrade for self-signed VPS environments
    if (allowInsecureHttp && supabaseUrl?.includes('dmytrotovstytskyi.online') && supabaseUrl.startsWith('https://')) {
        supabaseUrl = supabaseUrl.replace('https://', 'http://');
        console.log('🔄 Protocol downgraded to HTTP for SSL bypass:', supabaseUrl);
    }

    // 🔐 Optional TLS bypass for self-signed certs
    if (allowInsecureHttp && supabaseUrl?.includes('dmytrotovstytskyi.online')) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        console.log('🔓 SSL Verification disabled for:', supabaseUrl);
    }

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ CRITICAL ERROR [Server]: Supabase environment variables are missing!')
    }

    return createServerClient(
        supabaseUrl || 'http://missing-server-url.supabase.co',
        supabaseKey || 'missing-server-key',
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

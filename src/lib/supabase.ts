import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

declare global {
    // eslint-disable-next-line no-var
    var __supabaseBrowserClient: ReturnType<typeof createBrowserClient> | undefined
}

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// ✅ Ensure secure protocol in browser contexts to avoid mixed content WebSocket errors
if (typeof window !== 'undefined' && supabaseUrl.startsWith('http://')) {
    supabaseUrl = supabaseUrl.replace('http://', 'https://')
}

console.log('🔧 Supabase Config:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supply Supabase credentials to .env.local to enable real data access.')
}

const createSupabaseClient = () => {
    if (typeof window !== 'undefined') {
        if (!globalThis.__supabaseBrowserClient) {
            globalThis.__supabaseBrowserClient = createBrowserClient(
                supabaseUrl,
                supabaseAnonKey
            )
        }
        return globalThis.__supabaseBrowserClient
    }

    return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

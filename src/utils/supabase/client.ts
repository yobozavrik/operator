import { createBrowserClient } from '@supabase/ssr'

declare global {
    // eslint-disable-next-line no-var
    var __supabaseBrowserClient: ReturnType<typeof createBrowserClient> | undefined
}

const getSupabaseUrl = () => {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (typeof window !== 'undefined' && rawUrl.startsWith('http://')) {
        return rawUrl.replace('http://', 'https://')
    }
    return rawUrl
}

export function createClient() {
    if (!globalThis.__supabaseBrowserClient) {
        globalThis.__supabaseBrowserClient = createBrowserClient(
            getSupabaseUrl(),
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )
    }

    return globalThis.__supabaseBrowserClient
}

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('🔧 Supabase Config:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
})

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials! Check .env.local')
}

let supabaseInstance: SupabaseClient | undefined

const getSupabaseClient = (): SupabaseClient => {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
            db: {
                schema: 'graviton'
            },
            realtime: {
                enabled: false
            },
            auth: {
                persistSession: false
            }
        })
    }
    return supabaseInstance
}

export const supabase = getSupabaseClient()

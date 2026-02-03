import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔧 Supabase Config:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
})

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials! Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

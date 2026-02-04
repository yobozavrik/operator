import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials! Check environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

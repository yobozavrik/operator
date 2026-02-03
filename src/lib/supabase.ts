import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 🔐 AUTO-FIX: Force HTTP for self-hosted domain to avoid SSL rejection
if (supabaseUrl.includes('dmytrotovstytskyi.online') && supabaseUrl.startsWith('https://')) {
    supabaseUrl = supabaseUrl.replace('https://', 'http://');
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

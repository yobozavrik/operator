import { supabase } from '@/lib/supabase'

export async function GET() {
    const { data, error } = await supabase
        .from('dashboard_deficit')
        .select('*')
        .in('priority', [1, 2, 3]) // только дефицитные позиции
        .limit(100)

    if (error) return Response.json({ error }, { status: 500 })
    return Response.json(data)
}

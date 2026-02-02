import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    const { data, error } = await supabase
        .from('dashboard_deficit')
        .select('*')
        .in('priority', [1, 2, 3])
        .order('priority', { ascending: true })
        .order('deficit_percent', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Применяем маппинг приоритетов: critical, high, reserve, normal
    const mappedData = data.map((row: any) => ({
        ...row,
        priority_label: row.priority === 1 ? 'critical' :
            row.priority === 2 ? 'high' :
                (row.deficit_percent >= 30 && row.deficit_percent < 70) ? 'reserve' : 'normal'
    }));

    return NextResponse.json(mappedData)
}

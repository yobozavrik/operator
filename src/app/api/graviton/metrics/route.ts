import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    // Общая загрузка цеха
    const { data: deficitData, error: deficitError } = await supabase
        .from('dashboard_deficit')
        .select('deficit_kg')
        .in('priority', [1, 2, 3])

    if (deficitError) {
        console.error('Deficit error:', deficitError)
    }

    const totalDeficit = deficitData?.reduce((sum, row) => sum + (row.deficit_kg || 0), 0) || 0

    // Критические позиции
    const { count: criticalCount, error: countError } = await supabase
        .from('dashboard_deficit')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 1)

    if (countError) {
        console.error('Count error:', countError)
    }

    return NextResponse.json({
        shopLoad: totalDeficit,
        personnel: 8,
        criticalSKUs: criticalCount || 0,
        aiEfficiency: 94.2,
        lastUpdate: new Date().toISOString()
    })
}

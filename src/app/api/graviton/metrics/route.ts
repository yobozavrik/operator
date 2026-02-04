import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    // ✅ Одна агрегована VIEW замість обробки в Node.js
    const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .single();

    if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        totalKg: data.total_kg,
        criticalSKU: data.critical_sku_count,
        loadPercentage: Math.min(100, Math.round((data.total_kg / 662) * 100)),
        breakdown: {
            critical: data.critical_kg,
            high: data.high_kg,
            reserve: data.reserve_kg
        }
    });
}



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
        shopLoad: data.total_kg || 0,
        criticalSKU: data.critical_sku_count || 0,
        highSKU: data.high_sku_count || 0,
        reserveSKU: data.reserve_sku_count || 0,
        criticalWeight: data.critical_kg || 0,
        highWeight: data.high_kg || 0,
        reserveWeight: data.reserve_kg || 0,
        totalSKU: data.total_sku_count || 0,
        loadPercentage: Math.min(100, Math.round((data.total_kg / 662) * 100)),
        staffCount: 0,
        aiEfficiency: 98,
        lastUpdate: new Date().toISOString(),
        breakdown: {
            critical: data.critical_kg || 0,
            high: data.high_kg || 0,
            reserve: data.reserve_kg || 0
        }
    });
}



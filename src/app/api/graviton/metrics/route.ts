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
        shopLoad: Number(data?.total_kg) || 0,
        criticalSKU: Number(data?.critical_sku_count) || 0,
        highSKU: Number(data?.high_sku_count) || 0,
        reserveSKU: Number(data?.reserve_sku_count) || 0,
        criticalWeight: Number(data?.critical_kg) || 0,
        highWeight: Number(data?.high_kg) || 0,
        reserveWeight: Number(data?.reserve_kg) || 0,
        totalSKU: Number(data?.total_sku_count) || 0,
        loadPercentage: Math.min(100, Math.round((Number(data?.total_kg || 0) / 662) * 100)),
        staffCount: 0,
        aiEfficiency: 98,
        lastUpdate: new Date().toISOString(),
        breakdown: {
            critical: Number(data?.critical_kg) || 0,
            high: Number(data?.high_kg) || 0,
            reserve: Number(data?.reserve_kg) || 0
        }
    });
}



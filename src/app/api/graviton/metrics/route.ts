import { NextRequest, NextResponse } from 'next/server';
import { serverAuditLog } from '@/lib/logger.server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    await serverAuditLog('VIEW_METRICS', '/api/graviton/metrics', request, {
        timestamp: new Date().toISOString()
    });

    // ✅ Одна агрегована VIEW замість обробки в Node.js
    const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({
            totalKg: 0,
            criticalSKU: 0,
            loadPercentage: 0,
            breakdown: {
                critical: 0,
                high: 0,
                reserve: 0
            }
        });
    }

    const totalKg = Number(data?.total_kg) || 0;
    const criticalSKU = Number(data?.critical_sku_count) || 0;
    const highSKU = Number(data?.high_sku_count) || 0;
    const reserveSKU = Number(data?.reserve_sku_count) || 0;
    const criticalWeight = Number(data?.critical_kg) || 0;
    const highWeight = Number(data?.high_kg) || 0;
    const reserveWeight = Number(data?.reserve_kg) || 0;
    const totalSKU = Number(data?.total_sku_count) || 0;
    const loadPercentage = totalKg
        ? Math.min(100, Math.round((totalKg / 662) * 100))
        : 0;

    return NextResponse.json({
        shopLoad: totalKg,
        criticalSKU,
        highSKU,
        reserveSKU,
        criticalWeight,
        highWeight,
        reserveWeight,
        totalSKU,
        loadPercentage,
        staffCount: 0,
        aiEfficiency: 98,
        lastUpdate: new Date().toISOString(),
        breakdown: {
            critical: criticalWeight,
            high: highWeight,
            reserve: reserveWeight
        }
    });
}

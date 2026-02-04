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


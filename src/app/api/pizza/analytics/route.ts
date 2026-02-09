import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. KPI Data - Fetch from public.v_pub_analytics (expecting single row)
        const { data: kpi, error: kpiError } = await supabase
            .from('v_pub_analytics')
            .select('*')
            .select('*')
            .maybeSingle();

        if (kpiError) throw kpiError;

        // 2. Radar Data - Fetch from public.v_pub_radar for Critical Count and Top 5
        const { data: radar, error: radarError } = await supabase
            .from('v_pub_radar')
            .select('*');

        if (radarError) throw radarError;

        // --- CALCULATIONS ---

        // KPI values from v_pub_analytics
        // Expected columns: current_stock, total_need, total_target, fill_level
        const currentStock = Number(kpi?.current_stock) || 0;
        const totalNeed = Number(kpi?.total_need) || 0;     // Should be 423
        const totalTarget = Number(kpi?.total_target) || 0; // Should be 633

        // fill_level might be a string or number in view
        const fillLevelRaw = Number(kpi?.fill_level) || 0;
        const fillLevel = fillLevelRaw.toFixed(1);

        // KPI 3 Logic: Count items where shop_stock <= 0 from radar data
        const criticalPositions = radar?.filter((item: any) => (Number(item.shop_stock) || 0) <= 0).length || 0;

        // Top 5 Logic: Sort radar by risk_index desc and take top 5
        const top5 = radar
            ?.sort((a: any, b: any) => (b.risk_index || 0) - (a.risk_index || 0))
            .slice(0, 5)
            .map((item: any) => ({
                pizza_name: item.pizza_name,
                shop_stock: item.shop_stock,
                risk_index: item.risk_index
            })) || [];

        return NextResponse.json({
            kpi: {
                currentStock,
                totalNeed,
                totalTarget,
                criticalPositions, // Kept in data structure just in case, though UI might use totalTarget
                fillLevel
            },
            top5
        });

    } catch (error) {
        console.error('[Analytics API] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

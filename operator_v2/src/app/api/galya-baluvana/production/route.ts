import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        let startDate = searchParams.get('startDate');
        let endDate = searchParams.get('endDate');

        // If no explicit dates provided, find the max date available in the DB
        if (!startDate || !endDate) {
            const maxDateQuery = `SELECT MAX(production_date) as max_date FROM production.v_workshop_production`;
            const { data: maxDateData } = await supabase.rpc('exec_sql', { query: maxDateQuery });
            const latestDate = (maxDateData && maxDateData.length > 0 && maxDateData[0].max_date)
                ? maxDateData[0].max_date
                : new Date().toISOString().split('T')[0];

            startDate = startDate || latestDate;
            endDate = endDate || latestDate;
        }

        // Fetch dynamic production stats from v_workshop_production
        const productionQuery = `
            SELECT 
                category_name,
                COALESCE(SUM(total_quantity), 0) as total_quantity,
                COALESCE(SUM(batch_count), 0) as total_batches,
                COALESCE(SUM(total_value), 0) as total_value
            FROM production.v_workshop_production
            WHERE production_date >= '${startDate}' AND production_date <= '${endDate}'
            GROUP BY category_name
            ORDER BY total_quantity DESC
        `;

        const { data: productionStats, error: productionError } = await supabase.rpc('exec_sql', { query: productionQuery });

        if (productionError) {
            Logger.error('Supabase Galya Production API error', { error: productionError.message });
            throw new Error(productionError.message);
        }

        // Check if no data
        if (!productionStats || productionStats.length === 0) {
            return NextResponse.json({ categories: [] });
        }

        // Fetch write-offs (waste) for Craft Bread
        const craftBreadIndex = productionStats.findIndex((c: any) => c.category_name === 'Крафтовий Хліб' || c.category_name === 'Крафтовий хліб');

        if (craftBreadIndex !== -1) {
            const wasteQuery = `
                SELECT COALESCE(SUM(qty_waste), 0) as total_waste
                FROM bakery1.mv_craft_daily_mart 
                WHERE date >= '${startDate}' AND date <= '${endDate}'
            `;
            const { data: wasteData, error: wasteError } = await supabase.rpc('exec_sql', { query: wasteQuery });

            if (!wasteError && wasteData && wasteData.length > 0) {
                const totalWaste = wasteData[0].total_waste;
                const totalProduced = productionStats[craftBreadIndex].total_quantity || 0;

                productionStats[craftBreadIndex].total_waste = totalWaste;

                if (totalProduced > 0) {
                    // Calculate percentage relative to the total quantity produced in this period
                    productionStats[craftBreadIndex].waste_pct = Number(((totalWaste / totalProduced) * 100).toFixed(1));
                } else {
                    productionStats[craftBreadIndex].waste_pct = 0;
                }
            }
        }

        return NextResponse.json({
            categories: productionStats,
            period: { startDate, endDate }
        });

    } catch (err: any) {
        Logger.error('Critical Galya Production API Error', { error: err.message || String(err) });
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message
        }, { status: 500 });
    }
}

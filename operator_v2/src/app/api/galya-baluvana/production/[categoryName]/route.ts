import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ categoryName: string }> }
) {
    try {
        const resolvedParams = await params;
        const categoryName = decodeURIComponent(resolvedParams.categoryName);
        const { searchParams } = new URL(request.url);

        let startDate = searchParams.get('startDate');
        let endDate = searchParams.get('endDate');

        // Allow bypassing RLS or use the service role key for basic testing if needed
        // Assuming the client will send Auth headers, but we use the regular client here.

        // 1. If no date provided, fetch the last available production date 
        // to avoid returning an empty state when nothing was produced today.
        if (!startDate || !endDate) {
            const { data: latestEntry } = await supabase
                .from('v_workshop_production')
                .select('production_date')
                .order('production_date', { ascending: false })
                .limit(1)
                .single();

            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const latestDate = latestEntry?.production_date || todayStr;

            startDate = startDate || latestDate;
            endDate = endDate || latestDate;
        }

        // 2. Fetch all raw production lines dynamically from the view
        //    for the specified category and date range.
        const productionQuery = `
            SELECT 
                product_name,
                COALESCE(SUM(total_quantity), 0) as total_quantity,
                COALESCE(SUM(batch_count), 0) as total_batches,
                COALESCE(SUM(total_value), 0) as total_value
            FROM production.v_workshop_production
            WHERE production_date >= '${startDate}' AND production_date <= '${endDate}'
              AND category_name = '${categoryName}'
            GROUP BY product_name
            ORDER BY total_quantity DESC
        `;

        const { data: productionData, error: prodError } = await supabase.rpc('exec_sql', {
            query: productionQuery
        });

        if (prodError) {
            console.error("Error fetching detailed production data:", prodError);
            throw prodError;
        }

        // Fetch write-offs (waste) if the category is Craft Bread
        let enrichedProductionData = productionData || [];
        if (categoryName.toLowerCase() === 'крафтовий хліб' && enrichedProductionData.length > 0) {
            const wasteQuery = `
                SELECT 
                    sku_name as product_name, 
                    COALESCE(SUM(qty_waste), 0) as total_waste
                FROM bakery1.mv_craft_daily_mart
                WHERE date >= '${startDate}' AND date <= '${endDate}'
                GROUP BY sku_name
            `;
            const { data: wasteData, error: wasteError } = await supabase.rpc('exec_sql', { query: wasteQuery });

            if (!wasteError && wasteData) {
                // Merge waste data into production data
                enrichedProductionData = enrichedProductionData.map((item: any) => {
                    const matchingWaste = wasteData.find((w: any) => w.product_name === item.product_name);

                    if (matchingWaste) {
                        const totalWaste = matchingWaste.total_waste;
                        const totalProduced = item.total_quantity || 0;
                        const wastePct = totalProduced > 0 ? Number(((totalWaste / totalProduced) * 100).toFixed(1)) : 0;

                        return {
                            ...item,
                            total_waste: totalWaste,
                            waste_pct: wastePct
                        };
                    }
                    return item;
                });
            }
        }

        return NextResponse.json({
            categoryName: categoryName,
            period: {
                startDate,
                endDate
            },
            products: enrichedProductionData
        });

    } catch (error: any) {
        console.error('API Error details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch detailed production data', details: error.message },
            { status: 500 }
        );
    }
}

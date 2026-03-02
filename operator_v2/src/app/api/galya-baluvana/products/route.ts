import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: Request) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') || (() => {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            return date.toISOString().split('T')[0];
        })();
        const endDate = searchParams.get('endDate');
        const store = searchParams.get('store');
        const category = searchParams.get('category');

        const supabase = await createClient();

        let query = supabase.from('v_gb_top_products_analytics').select('*');

        if (startDate) {
            query = query.gte('transaction_date', startDate);
        }
        if (store) {
            query = query.eq('store_name', store);
        }
        if (category) {
            if (category === 'Без категорії') {
                query = query.is('category', null);
            } else {
                query = query.eq('category', category);
            }
        }
        if (endDate) {
            query = query.lte('transaction_date', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        // If category is "Крафтовий хліб", enrich with bakery1 specific metrics (write-offs and trends)
        if (category === 'Крафтовий хліб' || (!category && data?.some(p => p.category === 'Крафтовий хліб'))) {
            try {
                // 1. Fetch Waste % from SKU Cards
                const { data: skuCards } = await supabase.rpc('f_craft_get_sku_cards', {
                    p_start_date: startDate,
                    p_end_date: endDate || new Date().toISOString().split('T')[0]
                }, { head: false, get: false }).setHeader('Accept-Profile', 'bakery1');

                // 2. Fetch Trends from Trend RPC
                const { data: skuTrends } = await supabase.rpc('f_craft_get_sku_trend', {
                    p_date: endDate || new Date().toISOString().split('T')[0]
                }, { head: false, get: false }).setHeader('Accept-Profile', 'bakery1');

                // Merge metrics into the result
                const enrichedData = data.map(item => {
                    if (item.category === 'Крафтовий хліб') {
                        const card = (skuCards as any[])?.find(c => c.sku_name === item.product_name);
                        const trend = (skuTrends as any[])?.find(t => t.sku_name === item.product_name && (!store || t.store_name === store));

                        return {
                            ...item,
                            write_off_pct: card?.waste_pct || 0,
                            discount_pct: card?.disc_pct || 0,
                            trend_index: trend?.trend_index || 0,
                            is_bakery: true
                        };
                    }
                    return item;
                });

                return NextResponse.json(enrichedData);
            } catch (enrichError) {
                console.error('Enrichment Error:', enrichError);
                // Fallback to original data if enrichment fails
                return NextResponse.json(data);
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Products API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

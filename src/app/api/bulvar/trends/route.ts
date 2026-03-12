import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const supabase = await createClient();

    const query = `
        SELECT
            p.name as product_name,
            SUM(CASE WHEN t.date_close >= CURRENT_DATE - INTERVAL '7 days' AND t.date_close < CURRENT_DATE THEN COALESCE(ti.num, 0) ELSE 0 END) / 1000.0 as qty_last_7,
            SUM(CASE WHEN t.date_close >= CURRENT_DATE - INTERVAL '14 days' AND t.date_close < CURRENT_DATE - INTERVAL '7 days' THEN COALESCE(ti.num, 0) ELSE 0 END) / 1000.0 as qty_prev_7
        FROM categories.transactions t
        JOIN categories.transaction_items ti ON t.transaction_id = ti.transaction_id
        JOIN categories.products p ON ti.product_id = p.id
        JOIN categories.categories c ON p.category_id = c.category_id
        WHERE t.date_close >= CURRENT_DATE - INTERVAL '14 days' AND t.date_close < CURRENT_DATE
        AND c.category_name IN ('Страви від шефа', 'Хачапурі', 'Млинці', 'Котлети', 'Деруни', 'Сирники', 'Готові страви', 'Хінкалі')
        GROUP BY p.name
        ORDER BY qty_last_7 DESC
    `.trim();

    try {
        const { data, error } = await supabase.rpc('exec_sql', { query });

        if (error) {
            console.error('Error fetching bulvar trends:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e: any) {
        console.error('Exception fetching bulvar trends:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

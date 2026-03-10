import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const supabase = await createClient();

    const query = `
        SELECT 
            p.name as product_name,
            SUM(CASE WHEN t.date_close >= CURRENT_DATE - INTERVAL '7 days' AND t.date_close < CURRENT_DATE THEN COALESCE(ti.num, 0) ELSE 0 END) as qty_last_7,
            SUM(CASE WHEN t.date_close >= CURRENT_DATE - INTERVAL '14 days' AND t.date_close < CURRENT_DATE - INTERVAL '7 days' THEN COALESCE(ti.num, 0) ELSE 0 END) as qty_prev_7
        FROM categories.transactions t
        JOIN categories.transaction_items ti ON t.transaction_id = ti.transaction_id
        JOIN categories.products p ON ti.product_id = p.id
        JOIN categories.categories c ON p.category_id = c.category_id
        WHERE t.date_close >= CURRENT_DATE - INTERVAL '14 days' AND t.date_close < CURRENT_DATE
        AND c.category_name IN (
            'Вареники', 'Верховода', 'Голубці', 'Готові страви', 'Деруни', 
            'Зрази', 'Ковбаси', 'Котлети', 'Млинці', 'Моті', 'Пельмені', 
            'Перець фарширований', 'ПИРІЖЕЧКИ', 'Сирники', 'Страви від шефа', 
            'Хачапурі', 'Хінкалі', 'Чебуреки'
        )
        GROUP BY p.name
        ORDER BY qty_last_7 DESC
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { query });

        if (error) {
            console.error('Error fetching florida trends:', error);
            // Fallback: If exec_sql is not available or errors out, try raw query mechanism or just return empty
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error('Exception fetching florida trends:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

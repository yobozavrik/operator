import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SupabaseDeficitRow } from '@/types/bi';

export async function GET() {
    const { data, error } = await supabase
        .from('dashboard_deficit')
        .select('*')
        .order('назва_магазину', { ascending: true })
        .order('category_name', { ascending: true })
        .order('назва_продукту', { ascending: true });

    if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Приводимо типи та нормалізуємо дані для фронтенду
    const mappedData = (data as SupabaseDeficitRow[]).map((row) => ({
        ...row,
        priority_label: row.priority === 1 ? 'critical' :
            row.priority === 2 ? 'high' :
                row.priority === 3 ? 'reserve' : 'normal'
    }));

    return NextResponse.json(mappedData);
}

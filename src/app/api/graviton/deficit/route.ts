import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const { data, error } = await supabase
        .from('dashboard_deficit')
        .select('*')
        .in('priority_number', [1, 2, 3])  // ✅ Змінено на priority_number
        .order('priority_number', { ascending: true })  // ✅ Змінено
        .order('deficit_percent', { ascending: false })
        .limit(1000);

    if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
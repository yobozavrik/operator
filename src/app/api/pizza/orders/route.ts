import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Максимально чистый запрос без фильтров
        const { data, error } = await supabase
            .from('v_pizza_distribution_stats')
            .select('*');

        console.log("Данные из БД по пицце:", data?.length, "rows");
        if (data && data.length > 0) {
            console.log("First row example:", data[0]);
        }

        if (error) {
            console.error('Supabase Pizza API error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('Critical Pizza API Error:', err);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message
        }, { status: 500 });
    }
}

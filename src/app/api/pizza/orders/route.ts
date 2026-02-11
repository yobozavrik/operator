import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const supabase = await createClient();

        // Максимально чистый запрос без фильтров
        const { data, error } = await supabase
            .from('v_pizza_distribution_stats')
            .select('*');

        Logger.info("Данные из БД по пицце", { meta: { count: data?.length, firstRow: data?.[0] } });

        if (error) {
            Logger.error('Supabase Pizza API error', { error: error.message });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        Logger.error('Critical Pizza API Error', { error: err.message || String(err) });
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message
        }, { status: 500 });
    }
}

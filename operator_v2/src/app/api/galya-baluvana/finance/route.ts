import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
        const endDate = searchParams.get('endDate');   // YYYY-MM-DD
        const category = searchParams.get('category'); // Optional category filter
        const store = searchParams.get('store');       // Optional store filter

        const supabase = await createClient();

        let query = supabase.from('v_gb_finance_overview').select('*');

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
        if (category && category !== 'Усі') { // 'Усі' means All
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            Logger.error('Supabase Galya Finance API error', { error: error.message });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // We will perform the final category groupings on the frontend, so we just return the row data.
        return NextResponse.json(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        Logger.error('Critical Galya Finance API Error', { error: err.message || String(err) });
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message
        }, { status: 500 });
    }
}

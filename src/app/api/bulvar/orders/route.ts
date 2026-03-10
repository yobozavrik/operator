import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';
import { mergeWithPosterLiveStock } from '@/lib/poster-merger';

export const dynamic = 'force-dynamic';

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const supabase = await createClient();

        // Максимально чистый запрос без фильтров
        const { data, error } = await supabase
            .schema('bulvar1').from('v_bulvar_distribution_stats')
            .select('*');

        if (error) {
            Logger.error('Supabase bulvar API error', { error: error.message });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // --- NEW ARCHITECTURE: LIVE POSTER DATA ---
        // Intead of relying on max 10-minute old n8n webhook syncs into DB,
        // we merge the live Poster API data in Next.js memory immediately! (~1-2 seconds)
        let mergedData = data || [];
        try {
            mergedData = await mergeWithPosterLiveStock(data as any[]);
        } catch (posterErr) {
            Logger.error('Failed to merge Poster data, falling back to Supabase', { error: String(posterErr) });
            // Safe fallback keeps DB data
        }

        Logger.info("Данные из БД по Кондитерке (Объединенные с Live Poster)", { meta: { count: mergedData.length, firstRow: mergedData[0] } });

        return NextResponse.json(mergedData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        Logger.error('Critical bulvar API Error', { error: err.message || String(err) });
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { getAllLeftovers, getTodayManufactures } from '@/lib/posterApi';

export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        console.time('[Konditerka Stock Update] Total duration');
        console.log('[Konditerka Stock Update] Fetching data directly from Poster API...');

        // Получить данные из Poster
        const [allLeftovers, todayManufactures] = await Promise.all([
            getAllLeftovers(),
            getTodayManufactures()
        ]);

        console.timeEnd('[Konditerka Stock Update] Total duration');

        // СРАЗУ ВЕРНУТЬ клиенту (БЕЗ записи в БД)
        return NextResponse.json({
            success: true,
            data: allLeftovers,
            manufactures: todayManufactures,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Konditerka Stock Update] Error:', error);
        return NextResponse.json(
            { success: false, error: String(error.message || error) },
            { status: 500 }
        );
    }
}

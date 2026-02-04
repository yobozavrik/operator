import { NextRequest, NextResponse } from 'next/server';
import { serverAuditLog } from '@/lib/logger.server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    // Log API access
    await serverAuditLog('VIEW_DEFICIT', '/api/graviton/deficit', request, {
        timestamp: new Date().toISOString()
    });

    try {
        const { data, error } = await supabase
            .from('dashboard_deficit')  // ✅ Без схеми, використовує db.schema
            .select('*')
            .in('priority', [1, 2, 3])
            .order('priority', { ascending: true })
            .order('deficit_percent', { ascending: false })
            .limit(1000);

        if (error) {
            console.error('Supabase error:', error);
            await serverAuditLog('ERROR', '/api/graviton/deficit', request, {
                error: error.message
            });
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        // Маппінг priority для фронтенду
        const mappedData = (data || []).map((row: SupabaseDeficitRow) => ({
            ...row,
            priority: row.priority === 1 ? 'critical' :
                row.priority === 2 ? 'high' :
                    row.priority === 3 ? 'reserve' : 'normal',
            priority_number: row.priority
        }));

        return NextResponse.json(mappedData);

    } catch (err: any) {
        console.error('Critical API Error:', err);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}

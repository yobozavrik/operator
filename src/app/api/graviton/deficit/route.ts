import { NextRequest, NextResponse } from 'next/server';
import { serverAuditLog } from '@/lib/logger.server';
import { Logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const supabase = await createClient();

    // Log API access
    await serverAuditLog('VIEW_DEFICIT', '/api/graviton/deficit', request, {
        timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
        .from('dashboard_deficit')
        .select('*')
        .in('priority_number', [1, 2, 3])
        .order('priority_number', { ascending: true })
        .order('deficit_percent', { ascending: false })
        .limit(1000);

    if (error) {
        Logger.error('Supabase error', { error: error.message, path: '/api/graviton/deficit' });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Нормалізація для фронтенду
    const mappedData = (data || []).map(row => ({
        ...row,
        priority: row.priority_number === 1 ? 'critical' :
            row.priority_number === 2 ? 'high' :
                row.priority_number === 3 ? 'reserve' : 'normal'
    }));

    return NextResponse.json(mappedData);
}

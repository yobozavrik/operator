import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SupabaseDeficitRow } from '@/types/bi';
import { serverAuditLog } from '@/lib/logger';

export async function GET(request: NextRequest) {
    // Log API access
    await serverAuditLog('VIEW_DEFICIT', '/api/graviton/deficit', request, {
        timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
        .from('dashboard_deficit')
        .select('*')
        .in('priority', [1, 2, 3])
        .order('priority', { ascending: true })
        .order('deficit_percent', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Supabase error:', error);
        await serverAuditLog('ERROR', '/api/graviton/deficit', request, {
            error: error.message
        });
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


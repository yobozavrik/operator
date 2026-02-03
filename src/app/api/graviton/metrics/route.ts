import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { serverAuditLog } from '@/lib/logger.server'

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    // 🚧 TEMPORARY: Admin Bypass
    const isBypass = request.cookies.get('bypass_auth')?.value === 'true';
    let user = null;

    if (!isBypass) {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (!authUser || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = authUser;
    }

    // Log API access
    await serverAuditLog('VIEW_METRICS', '/api/graviton/metrics', request, {
        timestamp: new Date().toISOString()
    }, user?.id);

    try {
        // Общая загрузка цеха
        const { data: deficitData, error: deficitError } = await supabase
            .from('dashboard_deficit')
            .select('recommended_kg, priority')
            .in('priority', [1, 2, 3])

        if (deficitError) {
            console.error('Deficit error:', deficitError)
            await serverAuditLog('ERROR', '/api/graviton/metrics', request, {
                error: deficitError.message
            });
            return NextResponse.json({ error: deficitError.message }, { status: 500 });
        }

        const totalRecommended = deficitData?.reduce((sum, row) => sum + (row.recommended_kg || 0), 0) || 0

        // Критично (priority 1)
        const criticalItems = deficitData?.filter(row => row.priority === 1) || [];
        const criticalWeight = criticalItems.reduce((sum, row) => sum + (row.recommended_kg || 0), 0);
        const criticalSKU = criticalItems.length;

        // Високий (priority 2)
        const highItems = deficitData?.filter(row => row.priority === 2) || [];
        const highWeight = highItems.reduce((sum, row) => sum + (row.recommended_kg || 0), 0);
        const highSKU = highItems.length;

        // Резерв (priority 3)
        const reserveItems = deficitData?.filter(row => row.priority === 3) || [];
        const reserveWeight = reserveItems.reduce((sum, row) => sum + (row.recommended_kg || 0), 0);
        const reserveSKU = reserveItems.length;

        return NextResponse.json({
            shopLoad: totalRecommended,
            criticalSKU,
            staffCount: 8,
            criticalWeight,
            highWeight,
            reserveWeight,
            totalSKU: deficitData?.length || 0,
            highSKU,
            reserveSKU,
            aiEfficiency: 94.2,
            lastUpdate: new Date().toISOString()
        })
    } catch (err: any) {
        console.error('Critical API Error:', err);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}


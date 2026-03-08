import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        const store = searchParams.get('store');       // Optional store filter

        // Calculate previous period for trends
        const start = new Date(startDate);
        let previousStart = new Date(start);
        let previousEnd = new Date(start);

        if (endDate) {
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            previousEnd.setDate(previousEnd.getDate() - 1);
            previousStart.setDate(previousStart.getDate() - diffDays - 1);
        } else {
            previousEnd.setDate(previousEnd.getDate() - 1);
            previousStart.setDate(previousStart.getDate() - 7);
        }

        const prevStartDateStr = previousStart.toISOString().split('T')[0];
        const prevEndDateStr = previousEnd.toISOString().split('T')[0];

        // Construct SQL for current period
        let currentPeriodQuery = `
            SELECT
                SUM(t.payed_sum) AS total_revenue,
                SUM(t.total_profit_netto) AS total_profit,
                COUNT(t.transaction_id) AS total_checks,
                SUM(t.guests_count) AS total_guests,
                SUM(t.discount) AS total_discount,
                SUM(t.tip_sum) AS total_tips
            FROM
                categories.transactions t
            LEFT JOIN
                categories.spots s ON t.spot_id = s.spot_id
            WHERE
                t.status <> 3 
                AND DATE(t.date_start) >= '${startDate}'
        `;

        if (endDate) currentPeriodQuery += ` AND DATE(t.date_start) <= '${endDate}'`;
        if (store) currentPeriodQuery += ` AND s.name = '${store.replace(/'/g, "''")}'`;

        // Construct SQL for previous period
        let prevPeriodQuery = `
            SELECT
                SUM(t.payed_sum) AS total_revenue,
                SUM(t.total_profit_netto) AS total_profit,
                COUNT(t.transaction_id) AS total_checks,
                SUM(t.guests_count) AS total_guests,
                SUM(t.discount) AS total_discount,
                SUM(t.tip_sum) AS total_tips
            FROM
                categories.transactions t
            LEFT JOIN
                categories.spots s ON t.spot_id = s.spot_id
            WHERE
                t.status <> 3 
                AND DATE(t.date_start) >= '${prevStartDateStr}'
                AND DATE(t.date_start) <= '${prevEndDateStr}'
        `;
        if (store) prevPeriodQuery += ` AND s.name = '${store.replace(/'/g, "''")}'`;

        // Execute both queries in parallel using exec_sql via REST API
        const execSqlUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
        const headers = {
            'apikey': supabaseKey as string,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        };

        const [currentRes, prevRes] = await Promise.all([
            fetch(execSqlUrl, { method: 'POST', headers, body: JSON.stringify({ query: currentPeriodQuery }) }),
            fetch(execSqlUrl, { method: 'POST', headers, body: JSON.stringify({ query: prevPeriodQuery }) })
        ]);

        if (!currentRes.ok || !prevRes.ok) {
            const errData = await (!currentRes.ok ? currentRes : prevRes).text();
            Logger.error('KPI SQL Execution Failed', { error: errData });
            return NextResponse.json({ error: 'Failed to aggregate KPI data' }, { status: 500 });
        }

        const currentData = await currentRes.json();
        const prevData = await prevRes.json();

        // Process formulas locally
        const current = currentData[0] || {};
        const prev = prevData[0] || {};

        const responseData = {
            current: {
                revenue: Number(current.total_revenue) || 0,
                profit: Number(current.total_profit) || 0,
                margin_pct: current.total_revenue ? (Number(current.total_profit) / Number(current.total_revenue)) * 100 : 0,
                checks: Number(current.total_checks) || 0,
                avg_check: current.total_checks ? (Number(current.total_revenue) / Number(current.total_checks)) : 0,
                discount: Number(current.total_discount) || 0,
                tips: Number(current.total_tips) || 0,
                guests: Number(current.total_guests) || 0
            },
            previous: {
                revenue: Number(prev.total_revenue) || 0,
                profit: Number(prev.total_profit) || 0,
                margin_pct: prev.total_revenue ? (Number(prev.total_profit) / Number(prev.total_revenue)) * 100 : 0,
                checks: Number(prev.total_checks) || 0,
                avg_check: prev.total_checks ? (Number(prev.total_revenue) / Number(prev.total_checks)) : 0,
                discount: Number(prev.total_discount) || 0,
                tips: Number(prev.total_tips) || 0,
                guests: Number(prev.total_guests) || 0
            }
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        Logger.error('KPI API crash', { error: error.message });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

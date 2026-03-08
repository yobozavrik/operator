import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // By default, last 7 days
        const startDateStr = searchParams.get('startDate') || (() => {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            return date.toISOString().split('T')[0];
        })();

        const start = new Date(startDateStr);
        let previousStart = new Date(start);
        let previousEnd = new Date(start);

        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart.setDate(previousStart.getDate() - 7);

        const prevStartDateStr = previousStart.toISOString().split('T')[0];
        const prevEndDateStr = previousEnd.toISOString().split('T')[0];

        // 1. Fetch KPIs via SQL RPC (same as galya-baluvana/finance/kpi)
        const currentPeriodQuery = `SELECT SUM(payed_sum) AS total_revenue, COUNT(transaction_id) AS total_checks FROM categories.transactions WHERE status <> 3 AND DATE(date_start) >= '${startDateStr}'`;
        const prevPeriodQuery = `SELECT SUM(payed_sum) AS total_revenue, COUNT(transaction_id) AS total_checks FROM categories.transactions WHERE status <> 3 AND DATE(date_start) >= '${prevStartDateStr}' AND DATE(date_start) <= '${prevEndDateStr}'`;

        const execSqlUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
        const headers = { 'apikey': supabaseKey as string, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

        const [currentRes, prevRes] = await Promise.all([
            fetch(execSqlUrl, { method: 'POST', headers, body: JSON.stringify({ query: currentPeriodQuery }) }),
            fetch(execSqlUrl, { method: 'POST', headers, body: JSON.stringify({ query: prevPeriodQuery }) })
        ]);

        const currentData = currentRes.ok ? await currentRes.json() : [{}];
        const prevData = prevRes.ok ? await prevRes.json() : [{}];

        const current = currentData[0] || {};
        const prev = prevData[0] || {};

        const currentRevenue = Number(current.total_revenue) || 0;
        const prevRevenue = Number(prev.total_revenue) || 0;
        const currentTransactions = Number(current.total_checks) || 0;
        const prevTransactions = Number(prev.total_checks) || 0;

        const averageCheck = currentTransactions ? Math.round(currentRevenue / currentTransactions) : 0;
        const prevAverageCheck = prevTransactions ? Math.round(prevRevenue / prevTransactions) : 0;

        const revenueDelta = prevRevenue ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const transactionsDelta = prevTransactions ? ((currentTransactions - prevTransactions) / prevTransactions) * 100 : 0;
        const avgCheckDelta = prevAverageCheck ? ((averageCheck - prevAverageCheck) / prevAverageCheck) * 100 : 0;

        // 2. Fetch categories and daily trends from v_gb_finance_overview
        const supabase = await createClient();

        const [currOverviewRes, prevOverviewRes] = await Promise.all([
            supabase.from('v_gb_finance_overview').select('*').gte('transaction_date', startDateStr),
            supabase.from('v_gb_finance_overview').select('*').gte('transaction_date', prevStartDateStr).lte('transaction_date', prevEndDateStr)
        ]);

        const currOverview = currOverviewRes.data || [];
        const prevOverview = prevOverviewRes.data || [];

        // Aggregate by Category
        const categoryMap = new Map<string, number>();
        currOverview.forEach(row => {
            const cat = row.category || 'Інше';
            categoryMap.set(cat, (categoryMap.get(cat) || 0) + (Number(row.total_revenue) || 0));
        });

        const colors = ['#f43f5e', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6'];
        let colorIdx = 0;
        const revenueByCategory = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value: Math.round(value), fill: colors[colorIdx++ % colors.length] }))
            .sort((a, b) => b.value - a.value);

        // Aggregate Top Products (using categories as products proxy for now since view lacks product granularity)
        const topProducts = revenueByCategory.map((cat, i) => ({
            id: i + 1,
            name: cat.name,
            quantity: 0, // Not in view easily by category, mock 0
            revenue: cat.value,
        })).slice(0, 5);

        // Aggregate Daily Trend
        const dailyMap = new Map<string, { revenue: number, prevRevenue: number }>();

        // Setup empty days for the last 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const shortStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            dailyMap.set(dateStr, { revenue: 0, prevRevenue: 0 });
        }

        currOverview.forEach(row => {
            const dateStr = row.transaction_date.split('T')[0];
            if (dailyMap.has(dateStr)) {
                const existing = dailyMap.get(dateStr)!;
                dailyMap.set(dateStr, { ...existing, revenue: existing.revenue + (Number(row.total_revenue) || 0) });
            }
        });

        // For previous, map to equivalent day offset
        prevOverview.forEach(row => {
            const prevDate = new Date(row.transaction_date.split('T')[0]);
            const currDate = new Date(prevDate);
            currDate.setDate(currDate.getDate() + 7); // shift forward 7 days to match bucket
            const dateStr = currDate.toISOString().split('T')[0];

            if (dailyMap.has(dateStr)) {
                const existing = dailyMap.get(dateStr)!;
                dailyMap.set(dateStr, { ...existing, prevRevenue: existing.prevRevenue + (Number(row.total_revenue) || 0) });
            }
        });

        const dailyTrend = Array.from(dailyMap.entries()).map(([dateStr, data]) => {
            const d = new Date(dateStr);
            const days = ['Нд', 'Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб'];
            return {
                date: days[d.getDay()],
                revenue: Math.round(data.revenue),
                prevRevenue: Math.round(data.prevRevenue)
            };
        });

        return NextResponse.json({
            success: true,
            period: "Цей тиждень",
            kpi: {
                revenue: { current: currentRevenue, prev: prevRevenue, delta: revenueDelta },
                transactions: { current: currentTransactions, prev: prevTransactions, delta: transactionsDelta },
                averageCheck: { current: averageCheck, prev: prevAverageCheck, delta: avgCheckDelta }
            },
            charts: {
                revenueByCategory,
                topProducts,
                dailyTrend
            }
        });

    } catch (error: any) {
        Logger.error('Galya Baluvana Financial Data Error:', error);
        return NextResponse.json({ error: 'Failed to aggregate Galya Baluvana sales data', details: error.message }, { status: 500 });
    }
}

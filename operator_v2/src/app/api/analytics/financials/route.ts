import { NextResponse } from 'next/server';

const KEYCRM_API_URL = 'https://openapi.keycrm.app/v1';

export async function GET(request: Request) {
    try {
        const token = process.env.KEYCRM_API_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'KeyCRM API token not configured' }, { status: 500 });
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        // Note: To implement strict date filtering, we would pass filter[created_at] to KeyCRM.
        // For this prototype, we'll fetch the last 100 orders and do basic analysis.
        const ordersRes = await fetch(`${KEYCRM_API_URL}/order?limit=100`, { headers, next: { revalidate: 300 } });
        if (!ordersRes.ok) throw new Error(`Orders fetch failed: ${ordersRes.status}`);
        const ordersData = await ordersRes.json();
        const orders = ordersData.data || [];

        // --- AGGREGATION LOGIC ---
        let totalRevenue = 0;
        let totalDiscount = 0;
        let previousPeriodRevenue = 0; // Mock comparison since we only fetch 100 recent orders

        // Assuming first 50 are "Current Period" and next 50 are "Previous Period" for demonstration
        // In a real app with more API calls, we'd fetch exact dates.
        const currentPeriodOrders = orders.slice(0, 50);
        const prevPeriodOrders = orders.slice(50, 100);

        currentPeriodOrders.forEach((order: any) => {
            // Only count completed/paid orders ideally, but taking all for now to show data
            totalRevenue += order.grand_total || 0;
            totalDiscount += order.total_discount || 0;
        });

        prevPeriodOrders.forEach((order: any) => {
            previousPeriodRevenue += order.grand_total || 0;
        });

        const averageCheck = currentPeriodOrders.length > 0 ? Math.round(totalRevenue / currentPeriodOrders.length) : 0;
        const prevAverageCheck = prevPeriodOrders.length > 0 ? Math.round(previousPeriodRevenue / prevPeriodOrders.length) : 0;

        // Calculate deltas (percentages)
        const revenueDelta = previousPeriodRevenue > 0 ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 100;
        const transactionsDelta = prevPeriodOrders.length > 0 ? ((currentPeriodOrders.length - prevPeriodOrders.length) / prevPeriodOrders.length) * 100 : 100;
        const avgCheckDelta = prevAverageCheck > 0 ? ((averageCheck - prevAverageCheck) / prevAverageCheck) * 100 : 0;

        // Mock category data based on total revenue
        const revenueByCategory = [
            { name: 'Сукні', value: Math.round(totalRevenue * 0.45), fill: '#3b82f6' },
            { name: 'Джинси', value: Math.round(totalRevenue * 0.25), fill: '#8b5cf6' },
            { name: 'Футболки', value: Math.round(totalRevenue * 0.15), fill: '#10b981' },
            { name: 'Аксесуари', value: Math.round(totalRevenue * 0.15), fill: '#f59e0b' },
        ];

        // Mock top products
        const topProducts = [
            { id: 1, name: "Сукня 'Міла' (M)", quantity: 42, revenue: 105000, margin: 65 },
            { id: 2, name: "Лляний костюм (L)", quantity: 38, revenue: 89000, margin: 55 },
            { id: 3, name: "Базова Футболка", quantity: 120, revenue: 60000, margin: 30 },
            { id: 4, name: "Шовкова блуза", quantity: 25, revenue: 45000, margin: 70 },
            { id: 5, name: "Джинси кльош", quantity: 18, revenue: 27000, margin: 45 }
        ];

        // Mock daily trend
        const dailyTrend = [
            { date: 'Пн', revenue: 15400, prevRevenue: 12000 },
            { date: 'Вв', revenue: 18200, prevRevenue: 19000 },
            { date: 'Ср', revenue: 14500, prevRevenue: 13500 },
            { date: 'Чт', revenue: 21000, prevRevenue: 18000 },
            { date: 'Пт', revenue: 35000, prevRevenue: 28000 },
            { date: 'Сб', revenue: 42000, prevRevenue: 39000 },
            { date: 'Нд', revenue: 38000, prevRevenue: 35000 },
        ];

        return NextResponse.json({
            success: true,
            period: "Сьогодні / Останні 50 замовлень",
            kpi: {
                revenue: { current: totalRevenue, prev: previousPeriodRevenue, delta: revenueDelta },
                transactions: { current: currentPeriodOrders.length, prev: prevPeriodOrders.length, delta: transactionsDelta },
                averageCheck: { current: averageCheck, prev: prevAverageCheck, delta: avgCheckDelta }
            },
            charts: {
                revenueByCategory,
                topProducts,
                dailyTrend
            }
        });

    } catch (error: any) {
        console.error('Financial Data Error:', error);
        return NextResponse.json({ error: 'Failed to aggregate KeyCRM sales data', details: error.message }, { status: 500 });
    }
}

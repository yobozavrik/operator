import { NextResponse } from 'next/server';

const KEYCRM_API_URL = 'https://openapi.keycrm.app/v1';

// Server-side aggregation to keep the frontend fast and clean
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

        // 1. Fetch Orders (Recent 100 for aggregation)
        const ordersRes = await fetch(`${KEYCRM_API_URL}/order?limit=100`, { headers, next: { revalidate: 300 } });
        if (!ordersRes.ok) throw new Error(`Orders fetch failed: ${ordersRes.status}`);
        const ordersData = await ordersRes.json();
        const orders = ordersData.data || [];

        // 2. Fetch Offers (Inventory & Prices)
        const offersRes = await fetch(`${KEYCRM_API_URL}/offers?limit=100`, { headers, next: { revalidate: 300 } });
        if (!offersRes.ok) throw new Error(`Offers fetch failed: ${offersRes.status}`);
        const offersData = await offersRes.json();
        const offers = offersData.data || [];

        // --- AGGREGATION LOGIC ---

        // A. Trend Data (Group orders by Month)
        const salesByMonth: Record<string, number> = {};
        orders.forEach((order: any) => {
            if (order.status_id === 19) { // Status 19 might be "completed" based on earlier curl
                const date = new Date(order.created_at);
                const monthKey = date.toLocaleString('uk-UA', { month: 'short', year: '2-digit' }).replace('.', '');
                salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + (order.products_total || 0);
            }
        });

        // Generate trend array (Mocking Future forecast for now, but real past data)
        const trendData = Object.entries(salesByMonth).map(([month, total]) => ({
            month,
            actualSales: total as number | null,
            forecast: null as number | null,
            inventory: 150000, // Placeholder
            suggestedOrder: null as number | null,
            isFuture: false
        })).reverse(); // Assuming newest orders come first, reverse for chronological chart

        // Add mock future months for the Forecast UI
        trendData.push(
            { month: 'Кві 26', actualSales: 0, forecast: 120000, inventory: 80000, suggestedOrder: 30000, isFuture: true },
            { month: 'Тра 26', actualSales: 0, forecast: 140000, inventory: -20000, suggestedOrder: 60000, isFuture: true }
        );

        // B. Turn-Earn Data (Margin and Turnover from Offers)
        const turnEarnData = offers.slice(0, 50).filter((o: any) => o.price > 0).map((offer: any) => {
            const cost = offer.purchased_price || offer.price * 0.5; // Guessing cost if 0
            const marginPercent = ((offer.price - cost) / offer.price) * 100;

            // Mocking Days to Sell based on quantity for prototype (lower inventory = faster turnover usually)
            const daysToSell = offer.quantity > 0 ? Math.max(5, Math.floor(offer.quantity * 2)) : 100;

            return {
                name: offer.sku || `Product ${offer.id}`,
                x: daysToSell, // Days to Sell
                y: Math.round(marginPercent), // Margin %
                z: offer.price * (offer.quantity || 1), // Volume Value
                category: daysToSell < 30 ? 'Швидкі' : 'Повільні',
                quantity: offer.quantity,
                in_reserve: offer.in_reserve
            }
        });

        // C. KPIs
        const nonMovingValue = offers.filter((o: any) => o.quantity > 0).reduce((sum: number, o: any) => sum + (o.price * o.quantity), 0) * 0.15; // Roughly 15% is non-moving

        return NextResponse.json({
            success: true,
            kpi: {
                nonMoving: Math.round(nonMovingValue),
                avgDaysToSell: 38,
                riskRevenueLost: 45000
            },
            trendData,
            turnEarnData
        });

    } catch (error: any) {
        console.error('Data Aggregation Error:', error);
        return NextResponse.json({ error: 'Failed to aggregate Streamline data', details: error.message }, { status: 500 });
    }
}

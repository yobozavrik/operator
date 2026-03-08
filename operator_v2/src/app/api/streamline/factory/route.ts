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

        // 1. Fetch Offers (Inventory & Prices) from KeyCRM
        // We assume these offers represent materials or products in the factory context
        const offersRes = await fetch(`${KEYCRM_API_URL}/offers?limit=50`, { headers, next: { revalidate: 300 } });
        if (!offersRes.ok) throw new Error(`Offers fetch failed: ${offersRes.status}`);
        const offersData = await offersRes.json();
        const offers = offersData.data || [];

        // --- AGGREGATION LOGIC FOR FACTORY ---

        // A. Stockout & BOM Chart Data
        // Simulating Bill of Materials requirements against real inventory
        const stockoutData = offers.slice(0, 10).map((offer: any) => {
            const actualStock = offer.quantity || 0;
            // Mocking forecast (production need) based on some random variance around actual stock to make charts look realistic
            const baseNeed = actualStock > 0 ? actualStock * 1.5 : 200;
            const safetyStock = Math.round(baseNeed * 0.3); // 30% safety stock

            return {
                name: offer.sku || `Сировина ${offer.id}`,
                actual: actualStock,
                forecast: Math.round(baseNeed),
                safetyStock: safetyStock
            }
        });

        // B. Purchase Plan (What we need to order)
        const purchasePlan = offers
            .filter((offer: any) => {
                const actual = offer.quantity || 0;
                const safety = 100; // Simulated threshold
                return actual < safety; // Filter items below safety stock
            })
            .slice(0, 5) // Take top 5 urgent
            .map((offer: any, idx: number) => {
                const actual = offer.quantity || 0;
                const deficit = 500 - actual; // Target 500
                const cost = (offer.price > 0 ? offer.price : 50) * deficit;

                return {
                    id: offer.id,
                    item: offer.sku || `Матеріал #${offer.id}`,
                    supplier: idx % 2 === 0 ? "Текстиль-Контакт" : "Local Zipper Co.",
                    leadTime: idx % 2 === 0 ? "14 днів" : "5 днів",
                    moq: (offer.price > 100 ? 50 : 1000) + " шт",
                    requestedOrder: deficit + " шт",
                    status: actual === 0 ? "Терміново (Stockout)" : "Планово",
                    cost: cost.toLocaleString() + " ₴"
                };
            });

        // C. Factory KPIs
        const totalInventoryValue = offers.reduce((sum: number, o: any) => sum + ((o.price || 150) * (o.quantity || 0)), 0);
        const criticalItems = offers.filter((o: any) => (o.quantity || 0) < 5).length;

        return NextResponse.json({
            success: true,
            kpi: {
                daysOfSupply: Math.max(5, Math.floor(totalInventoryValue / 15000)), // Mock calculation
                stockoutRiskCount: criticalItems,
                overstockValue: Math.round(totalInventoryValue * 0.12) // Assume 12% is overstock
            },
            stockoutData,
            purchasePlan: purchasePlan.length > 0 ? purchasePlan : [
                { id: 999, item: "Усі матеріали в нормі", supplier: "-", leadTime: "-", moq: "-", requestedOrder: "-", status: "Ок", cost: "-" }
            ]
        });

    } catch (error: any) {
        console.error('Data Aggregation Error:', error);
        return NextResponse.json({ error: 'Failed to aggregate Streamline API data for Factory', details: error.message }, { status: 500 });
    }
}

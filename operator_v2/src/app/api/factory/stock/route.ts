import { NextResponse } from 'next/server'

// In-memory cache
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute

async function fetchAllPages(endpoint: string, token: string) {
    const isQueryParam = endpoint.includes('?');
    const separator = isQueryParam ? '&' : '?';

    // Always fetch page 1 first to get the total count
    const firstRes = await fetch(`https://openapi.keycrm.app/v1/${endpoint}${separator}limit=50&page=1`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!firstRes.ok) {
        console.error(`Failed to fetch ${endpoint} page 1:`, await firstRes.text());
        return [];
    }
    const firstData = await firstRes.json();
    const total = firstData.total || 0;
    const totalPages = Math.ceil(total / 50);

    let allItems = [...(firstData.data || [])];

    // Fetch remaining in batches of 10 to avoid rate limits
    const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2);
    const batchSize = 10;
    for (let i = 0; i < remainingPages.length; i += batchSize) {
        const batch = remainingPages.slice(i, i + batchSize);
        const promises = batch.map(page =>
            fetch(`https://openapi.keycrm.app/v1/${endpoint}${separator}limit=50&page=${page}`, {
                headers: { "Authorization": `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : { data: [] })
        );
        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res.data) allItems.push(...res.data);
        });
    }

    return allItems;
}

export async function GET() {
    try {
        const token = process.env.KEYCRM_API_TOKEN
        if (!token) {
            return NextResponse.json({ error: "Missing KeyCRM API token" }, { status: 500 })
        }

        // Return from cache if valid
        const now = Date.now();
        if (cachedData && (now - lastFetchTime < CACHE_DURATION_MS)) {
            return NextResponse.json({ data: cachedData, cached: true })
        }

        const [stocks, offers] = await Promise.all([
            fetchAllPages("offers/stocks", token),
            fetchAllPages("offers?include=product", token)
        ]);

        const stockMap = new Map();
        stocks.forEach((s: any) => stockMap.set(s.id, s));

        const joinedData = offers.map((offer: any) => {
            const stockInfo = stockMap.get(offer.id) || {};
            return {
                ...offer,
                quantity: stockInfo.quantity || 0,
                in_reserve: stockInfo.reserve || 0,
                price: stockInfo.price || offer.price || 0,
                purchased_price: stockInfo.purchased_price || offer.purchased_price || 0
            };
        });

        // Update cache
        cachedData = joinedData;
        lastFetchTime = Date.now();

        return NextResponse.json({ data: joinedData, cached: false })

    } catch (error) {
        console.error("KeyCRM API Proxy Exception:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

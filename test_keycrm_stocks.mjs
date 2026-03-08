const token = process.env.KEYCRM_API_TOKEN || "YjJjYmZhNzc5MzYyODU1MWYzYWU3NDAyNGU2N2Q0MDRlYzM2MTMwMA";

async function fetchAllPages(endpoint) {
    console.log(`Starting fetch for ${endpoint}...`);
    const firstRes = await fetch(`https://openapi.keycrm.app/v1/${endpoint}?limit=50&page=1`, { headers: { "Authorization": `Bearer ${token}` } });
    const firstData = await firstRes.json();
    const total = firstData.total || 0;
    const totalPages = Math.ceil(total / 50);
    console.log(`Total items: ${total}, Total pages: ${totalPages}`);

    let allItems = [...(firstData.data || [])];

    // Fetch remaining in batches of 10 to avoid rate limits
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const batchSize = 10;
    for (let i = 0; i < remainingPages.length; i += batchSize) {
        const batch = remainingPages.slice(i, i + batchSize);
        console.log(`Fetching pages ${batch[0]} - ${batch[batch.length - 1]}...`);
        const promises = batch.map(page =>
            fetch(`https://openapi.keycrm.app/v1/${endpoint}?limit=50&page=${page}`, { headers: { "Authorization": `Bearer ${token}` } })
                .then(res => res.json())
        );
        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res.data) allItems.push(...res.data);
        });
    }

    console.log(`Finished ${endpoint}. Total collected: ${allItems.length}`);
    return allItems;
}

async function main() {
    const start = Date.now();
    try {
        const stocks = await fetchAllPages("offers/stocks");
        const offers = await fetchAllPages("offers?include=product");

        console.log(`Test completed in ${Date.now() - start}ms`);

        if (stocks.length > 0 && offers.length > 0) {
            console.log("\nSample mapping for ID 3:");
            const stock3 = stocks.find(s => s.id === 3);
            const offer3 = offers.find(o => o.id === 3);
            console.log("Stock:", stock3);
            console.log("Offer:", offer3?.product?.name);
        }

    } catch (e) {
        console.error(e);
    }
}

main();

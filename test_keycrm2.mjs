const token = process.env.KEYCRM_API_TOKEN || "YjJjYmZhNzc5MzYyODU1MWYzYWU3NDAyNGU2N2Q0MDRlYzM2MTMwMA";
const urlOffers = "https://openapi.keycrm.app/v1/offers?include=product";

async function fetchFromKeyCRM(url) {
    try {
        console.log(`Fetching ${url}...`);
        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });
        if (!res.ok) {
            console.error(`HTTP Error: ${res.status}`);
            const text = await res.text();
            console.error(text);
            return;
        }
        const data = await res.json();
        console.log(JSON.stringify(data.data.slice(0, 1), null, 2));
    } catch (e) {
        console.error(e);
    }
}

fetchFromKeyCRM(urlOffers);

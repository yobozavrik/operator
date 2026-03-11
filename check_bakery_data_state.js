
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        console.log('--- Last data in mv_craft_daily_mart ---');
        const queryMaxDate = "SELECT max(date) FROM bakery1.mv_craft_daily_mart";
        let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryMaxDate })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log('--- Sample data for SKU 768 last 3 days ---');
        const querySample = "SELECT date, store_name, qty_delivered, qty_fresh_sold, qty_disc_sold, qty_waste FROM bakery1.mv_craft_daily_mart WHERE sku_id = 768 ORDER BY date DESC LIMIT 10";
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: querySample })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log('--- Recent Sales Raw ---');
        const queryRaw = "SELECT date, магазин_id, товар_id, кількість_шт FROM bakery1.хліб_продажі_свіжі ORDER BY date DESC LIMIT 5";
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryRaw })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

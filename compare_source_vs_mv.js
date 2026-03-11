
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        const targetDate = '2026-03-10';

        console.log(`--- Data in SOURCE VIEW for ${targetDate} ---`);
        const querySource = `SELECT count(*) as total_rows, sum(кількість_шт) as total_qty FROM bakery1.хліб_продажі_свіжі WHERE дата = '${targetDate}'`;
        let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: querySource })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log(`--- Data in DASHBOARD MV for ${targetDate} ---`);
        const queryMV = `SELECT count(*) as total_rows FROM bakery1.mv_craft_daily_mart WHERE date = '${targetDate}'`;
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryMV })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

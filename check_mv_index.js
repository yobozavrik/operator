
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        console.log('--- Checking for unique index on mv_craft_daily_mart ---');
        const queryIndex = `
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE schemaname = 'bakery1' AND tablename = 'mv_craft_daily_mart'
        `;
        let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryIndex })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log('--- Checking for actual waste table data ---');
        const queryWaste = 'SELECT max("дата") FROM bakery1."хліб_переміщення_списання"';
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryWaste })
        });
        console.log('max real waste date:', JSON.stringify(await response.json(), null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

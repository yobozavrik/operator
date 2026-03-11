
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        console.log('--- Checking довідник_магазинів ---');
        const query = "SELECT count(*) FROM bakery1.довідник_магазинів";
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log('--- Checking active views ---');
        const queryViews = "SELECT viewname FROM pg_views WHERE schemaname = 'bakery1' AND viewname = 'mv_craft_daily_mart'";
        const resp2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryViews })
        });
        console.log('Is mv_craft_daily_mart a VIEW now?', JSON.stringify(await resp2.json(), null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();

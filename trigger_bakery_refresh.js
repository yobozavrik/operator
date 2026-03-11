
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        console.log('--- Triggering manual refresh ---');
        const queryRefresh = "SELECT bakery1.f_craft_nightly_refresh_and_alerts()";
        let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryRefresh })
        });
        const result = await response.json();
        console.log('Refresh result:', JSON.stringify(result, null, 2));

        console.log('--- Checking max date again ---');
        const queryMaxDate = "SELECT max(date) FROM bakery1.mv_craft_daily_mart";
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryMaxDate })
        });
        console.log('New max date:', JSON.stringify(await response.json(), null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

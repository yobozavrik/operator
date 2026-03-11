
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        console.log('--- Tables in bakery1 ---');
        const tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'bakery1' AND table_type = 'BASE TABLE'";
        let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: tablesQuery })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log('--- Views in bakery1 ---');
        const viewsQuery = "SELECT table_name FROM information_schema.views WHERE table_schema = 'bakery1' UNION SELECT matviewname FROM pg_matviews WHERE schemaname = 'bakery1'";
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: viewsQuery })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log('--- Functions in bakery1 ---');
        const funcsQuery = "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'bakery1'";
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: funcsQuery })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

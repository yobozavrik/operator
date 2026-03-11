
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        const functions = [
            'fn_bread_autopilot_demand_v1',
            'fn_bread_autopilot_decision_v1',
            'fn_bread_apply_autopilot_v1',
            'v_craft_bread_avg4' // This view might contain the average calculation logic
        ];

        for (const fn of functions) {
            console.log(`--- Definition of ${fn} ---`);
            const query = `
                SELECT 
                    CASE 
                        WHEN (SELECT 1 FROM pg_views WHERE viewname = '${fn}' AND schemaname = 'bakery1') = 1 THEN pg_get_viewdef('bakery1.${fn}', true)
                        WHEN (SELECT 1 FROM pg_matviews WHERE matviewname = '${fn}' AND schemaname = 'bakery1') = 1 THEN pg_get_viewdef('bakery1.${fn}', true)
                        ELSE (
                            SELECT pg_get_functiondef(p.oid)
                            FROM pg_proc p 
                            JOIN pg_namespace n ON p.pronamespace = n.oid 
                            WHERE n.nspname = 'bakery1' AND p.proname = '${fn}'
                        )
                    END as definition
            `;
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();

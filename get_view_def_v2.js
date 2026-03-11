
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
                query: "SELECT view_definition FROM information_schema.views WHERE table_name = 'v_pizza_distribution_stats';"
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errBody}`);
        }

        const data = await response.json();
        console.log('View Definition for v_pizza_distribution_stats:');
        console.log(data?.[0]?.view_definition || 'View not found or definition unavailable.');
    } catch (error) {
        console.error('Error fetching view definition:', error);
    }
}

main();

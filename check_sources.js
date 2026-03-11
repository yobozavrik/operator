
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        const items = [
            'хліб_переміщення_поставки',
            'хліб_продажі_свіжі',
            'хліб_продажі_хліб30',
            'хліб_переміщення_списання'
        ];

        for (const item of items) {
            console.log(`--- Definition of ${item} ---`);
            const query = `
                SELECT 
                    CASE 
                        WHEN (SELECT 1 FROM pg_views WHERE viewname = '${item}' AND schemaname = 'bakery1') = 1 THEN pg_get_viewdef('bakery1.${item}', true)
                        ELSE 'BASE TABLE'
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

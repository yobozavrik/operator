
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        const query = `
            WITH sales_14 AS (
                SELECT 
                    ti.product_id,
                    p.name as product_name,
                    SUM(COALESCE(ti.num, 0)) / 14.0 as avg_14
                FROM categories.transactions t
                JOIN categories.transaction_items ti ON t.transaction_id = ti.transaction_id
                JOIN categories.products p ON ti.product_id = p.id
                WHERE t.date_close >= CURRENT_DATE - INTERVAL '14 days'
                  AND t.date_close < CURRENT_DATE
                  AND (p.name ~~* '%піца%' OR p.name ~~* 'Піца%')
                GROUP BY ti.product_id, p.name
            )
            SELECT * FROM sales_14 ORDER BY avg_14 DESC LIMIT 5
        `;
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query })
        });
        const data = await response.json();
        console.log('Sample 14-day Averages (Pizza):');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();

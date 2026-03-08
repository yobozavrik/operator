
const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function run() {
    // Check if we can join manufactures -> items -> products -> categories to get total output
    // Note: removed all trailing semicolons inside the string.
    const q2 = `
        SELECT 
            c.category_name,
            COUNT(DISTINCT m.manufacture_id) as total_manufactures,
            SUM(mi.quantity) as total_qty
        FROM categories.manufactures m
        JOIN categories.manufacture_items mi ON m.manufacture_id = mi.manufacture_id
        JOIN categories.products p ON mi.product_id = CAST(p.id AS INTEGER)
        JOIN categories.categories c ON p.category_id = c.category_id
        WHERE m.manufacture_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY c.category_name
        ORDER BY total_qty DESC
    `;

    try {
        const r2 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q2 })
        });
        console.log("aggregated production output:");
        console.table(await r2.json());

    } catch (e) {
        console.error(e);
    }
}

run();

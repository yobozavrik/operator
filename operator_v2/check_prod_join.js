
const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function run() {
    const q1 = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'categories' AND table_name = 'products'
    `;

    // Check if we can join manufactures -> items -> products -> categories to get total output
    const q2 = `
        SELECT 
            c.category_name,
            COUNT(DISTINCT m.manufacture_id) as total_manufactures,
            SUM(mi.quantity) as total_qty
        FROM categories.manufactures m
        JOIN categories.manufacture_items mi ON m.manufacture_id = mi.manufacture_id
        JOIN categories.products p ON mi.product_id = p.product_id
        JOIN categories.categories c ON CAST(p.category_name AS TEXT) = c.category_name
        WHERE m.manufacture_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY c.category_name
        ORDER BY total_qty DESC
        LIMIT 10;
    `;

    try {
        const r1 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q1 })
        });
        console.log("columns of products:", await r1.json());

        const r2 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q2 })
        });
        console.log("aggregated production output:", await r2.json());

    } catch (e) {
        console.error(e);
    }
}

run();

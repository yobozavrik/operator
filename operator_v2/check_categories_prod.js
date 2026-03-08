
const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function run() {
    const q1 = `
        SELECT table_schema, table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'categories'
        ORDER BY table_name
    `;

    const q2 = `SELECT * FROM categories.categories LIMIT 5`;

    try {
        const r1 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q1 })
        });
        console.log("Categories Schema Tables:");
        console.table(await r1.json());

        const r2 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q2 })
        });
        console.log("categories.categories:", await r2.json());

    } catch (e) {
        console.error(e);
    }
}

run();

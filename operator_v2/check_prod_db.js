
const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function run() {
    const q1 = `SELECT * FROM public.v_pizza_summary_stats LIMIT 1`;

    // Also check what tables we have in bakery1
    const q2 = `
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'bakery1') 
          AND (table_name ILIKE '%plan%' OR table_name ILIKE '%stock%' OR table_name ILIKE '%prod%' OR table_name ILIKE '%sum%')
        ORDER BY table_schema, table_name
    `;

    try {
        const r1 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q1 })
        });
        console.log("v_pizza_summary_stats:", await r1.json());

        const r2 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q2 })
        });
        console.log("Production Tables:", await r2.json());

    } catch (e) {
        console.error(e);
    }
}

run();

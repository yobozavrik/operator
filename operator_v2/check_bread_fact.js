
const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function run() {
    const q1 = `SELECT * FROM bakery1.bread_production_fact LIMIT 1`;

    try {
        const r1 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q1 })
        });
        console.log("bakery1.bread_production_fact:", await r1.json());
    } catch (e) {
        console.error(e);
    }
}

run();

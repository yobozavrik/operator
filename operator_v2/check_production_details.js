
const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function run() {
    const q1 = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'production' AND table_name = 'v_workshop_production'
    `;
    const q2 = `SELECT * FROM production.v_workshop_production LIMIT 5`;

    const q3 = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'production' AND table_name = 'manufacture_fact'
    `;

    try {
        const r1 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q1 })
        });
        console.log("v_workshop_production columns:");
        console.table(await r1.json());

        const r2 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q2 })
        });
        console.log("v_workshop_production sample:", await r2.json());

        const r3 = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q3 })
        });
        console.log("manufacture_fact columns:");
        console.table(await r3.json());

    } catch (e) {
        console.error(e);
    }
}

run();

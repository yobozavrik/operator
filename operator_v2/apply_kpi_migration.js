
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '20260228_finance_kpi_view.sql'), 'utf8');

    try {
        const response = await fetch(`${supabaseUrl}`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });
        if (response.ok) {
            console.log("Migration applied successfully!");
        } else {
            const data = await response.json();
            console.error("Migration error:", data);
        }

    } catch (e) {
        console.error("Fetch error:", e);
    }
}

run();

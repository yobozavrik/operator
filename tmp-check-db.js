const SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

fetch('https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: "SELECT product_id, product_name FROM graviton.production_catalog WHERE is_active = true" })
})
    .then(r => r.json())
    .then(data => {
        const list = data.map(d => `${d.product_name} (${d.product_id})`);
        console.log(list.join('\n'));
    })
    .catch(console.error);

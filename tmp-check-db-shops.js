const https = require('https');
const SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

function fetchShops() {
    return new Promise((resolve, reject) => {
        const req = https.request('https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql', {
            method: 'POST',
            headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(JSON.stringify({ query: "SELECT * FROM graviton.distribution_shops LIMIT 5" }));
        req.end();
    });
}
async function run() {
    const shops = await fetchShops();
    console.log(shops);
}
run();

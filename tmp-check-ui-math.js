const https = require('https');
const SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';
const POSTER_TOKEN = '526379:996915581eb0d8885af8187640385157';

async function fetchPoster(method, params = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://galia-baluvana34.joinposter.com/api/${method}`);
        url.searchParams.append('token', POSTER_TOKEN);
        for (const [key, val] of Object.entries(params)) url.searchParams.append(key, val);
        https.get(url.toString(), (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}
function fetchCatalog() {
    return new Promise((resolve, reject) => {
        const req = https.request('https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql', {
            method: 'POST',
            headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data).map(d => String(d.product_id))));
        });
        req.on('error', reject);
        req.write(JSON.stringify({ query: "SELECT product_id FROM graviton.production_catalog WHERE is_active = true" }));
        req.end();
    });
}
async function run() {
    const posterCatalog = await fetchCatalog();
    const dateStr = '2026-03-10';
    const manufacturesData = await fetchPoster('storage.getManufactures', { dateFrom: dateStr, dateTo: dateStr, storage_id: '5' });
    const posterManufactures = manufacturesData.response || [];

    // EXACT UI LOGIC
    let total = 0;
    const gravitonM = posterManufactures.filter((m) => String(m.storage_id) === '5');
    const catalogSet = new Set(posterCatalog.map(String));

    let included = {};
    gravitonM.forEach(m => {
        if (m.products) {
            m.products.forEach((p) => {
                const pid = String(p.product_id || p.ingredient_id || '');
                if (pid && catalogSet.has(pid)) {
                    let w = parseFloat(p.product_num || '0');
                    total += w;
                    included[pid] = (included[pid] || 0) + w;
                }
            });
        }
    });

    console.log("Total computed exact UI logic:", total.toFixed(3));
}
run();

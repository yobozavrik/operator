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
async function run() {
    const manufacturesData = await fetchPoster('storage.getManufactures', { dateFrom: '2026-03-10', dateTo: '2026-03-10' });
    const mfs = (manufacturesData.response || []).filter(m => String(m.storage_id) === '5');

    // Fetch menu
    const productsData = await fetchPoster('menu.getProducts');
    const ingredientsData = await fetchPoster('menu.getIngredients');
    const prodMap = {};
    if (productsData.response) productsData.response.forEach(p => prodMap[p.product_id] = p.product_name);
    if (ingredientsData.response) ingredientsData.response.forEach(i => prodMap[`ing_${i.ingredient_id}`] = i.ingredient_name);

    let total = 0;
    mfs.forEach(m => {
        if (m.products) {
            m.products.forEach(p => {
                const w = parseFloat(p.product_num || '0');
                total += w;

                const pid = p.product_id || p.ingredient_id;
                const type = p.product_id ? 'product' : 'ingredient';
                const name = type === 'product' ? prodMap[pid] : prodMap[`ing_${pid}`];

                console.log(`- ${name || pid} : ${w.toFixed(3)} kg`);
            });
        }
    });
    console.log("Total:", total.toFixed(3));
}
run();

const https = require('https');

const POSTER_TOKEN = '526379:996915581eb0d8885af8187640385157';
const POSTER_ACCOUNT = 'galia-baluvana34';

async function fetchPoster(method, params = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
        url.searchParams.append('token', POSTER_TOKEN);
        for (const [key, val] of Object.entries(params)) {
            url.searchParams.append(key, val);
        }

        https.get(url.toString(), (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        const today = new Date().toISOString().split('T')[0];
        // The user was testing on 10th of March 2026.
        const dateStr = '2026-03-10';

        const manufacturesData = await fetchPoster('storage.getManufactures', {
            dateFrom: dateStr,
            dateTo: dateStr,
            storage_id: '5'
        });

        const mfs = manufacturesData.response || [];
        let total = 0;
        let itemWeights = {};

        mfs.forEach(m => {
            if (m.products) {
                m.products.forEach(p => {
                    const weight = parseFloat(p.product_num || '0');
                    total += weight;

                    const id = p.product_id || p.ingredient_id;
                    const type = p.product_id ? 'product' : 'ingredient';

                    if (!itemWeights[`${type}_${id}`]) itemWeights[`${type}_${id}`] = 0;
                    itemWeights[`${type}_${id}`] += weight;
                });
            }
        });

        console.log(`Total manufactured weight on ${dateStr}:`, total.toFixed(3));
        console.log("By ID:");
        console.log(itemWeights);

        // Let's also fetch menu to get names
        const productsData = await fetchPoster('menu.getProducts');
        const ingredientsData = await fetchPoster('menu.getIngredients');

        const prodMap = {};
        if (productsData.response) productsData.response.forEach(p => prodMap[p.product_id] = p.product_name);
        if (ingredientsData.response) ingredientsData.response.forEach(i => prodMap[`ing_${i.ingredient_id}`] = i.ingredient_name);

        console.log("\nBy Name:");
        for (const key of Object.keys(itemWeights)) {
            const parts = key.split('_');
            const type = parts[0];
            const id = parts[1];

            let name = 'UNKNOWN';
            if (type === 'product' && prodMap[id]) name = prodMap[id];
            if (type === 'ingredient' && prodMap[`ing_${id}`]) name = prodMap[`ing_${id}`];

            console.log(`- ${name} (ID: ${key}): ${itemWeights[key].toFixed(3)} kg`);
        }

    } catch (err) {
        console.error(err);
    }
}

run();

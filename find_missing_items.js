const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const POSTER_TOKEN = env.POSTER_TOKEN;
const POSTER_ACCOUNT = 'galia-baluvana34';

async function posterRequest(method, params = {}) {
    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await fetch(url.toString());
    return await response.json();
}

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // 1. Get Catalog
    const { data: catalogData } = await supabaseAdmin.rpc('exec_sql', {
        query: "SELECT product_id, product_name FROM graviton.production_catalog"
    });
    const catalogSet = new Set(catalogData.map(c => String(c.product_id)));

    // 2. Get Manufactures for today
    const dateStr = new Date().toISOString().split('T')[0];
    const manData = await posterRequest('storage.getManufactures', { dateFrom: dateStr, dateTo: dateStr });
    const allMan = manData.response || [];

    const gravitonMan = allMan.filter(m => String(m.storage_id) === '2' || String(m.storage_id) === '15');

    console.log('--- ITEMS NOT IN CATALOG ---');
    let excludedTotal = 0;

    gravitonMan.forEach(m => {
        if (m.products) {
            m.products.forEach(p => {
                const pid = String(p.product_id || p.ingredient_id || '');
                const pname = p.product_name || p.ingredient_name || 'Unknown';
                const weight = parseFloat(p.product_num || '0');

                if (!catalogSet.has(pid)) {
                    console.log(`[EXCLUDED] ${pname} (ID: ${pid}) - ${weight} kg`);
                    excludedTotal += weight;
                }
            });
        }
    });

    console.log('---------------------------');
    console.log(`TOTAL EXCLUDED: ${excludedTotal.toFixed(3)} kg`);

    console.log('\n--- ITEMS IN CATALOG ---');
    let includedTotal = 0;
    gravitonMan.forEach(m => {
        if (m.products) {
            m.products.forEach(p => {
                const pid = String(p.product_id || p.ingredient_id || '');
                const pname = p.product_name || p.ingredient_name || 'Unknown';
                const weight = parseFloat(p.product_num || '0');

                if (catalogSet.has(pid)) {
                    includedTotal += weight;
                }
            });
        }
    });
    console.log(`TOTAL INCLUDED: ${includedTotal.toFixed(3)} kg`);
    console.log(`GRAND TOTAL (Poster): ${(includedTotal + excludedTotal).toFixed(3)} kg`);
})();

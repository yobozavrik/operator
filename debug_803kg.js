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
        query: "SELECT product_id, product_name FROM graviton.production_catalog WHERE is_active = true"
    });
    const catalogSet = new Set(catalogData.map(c => String(c.product_id)));
    const catalogNames = catalogData.reduce((acc, current) => {
        acc[String(current.product_id)] = current.product_name;
        return acc;
    }, {});

    // 2. Get Manufactures for today
    const dateStr = new Date().toISOString().split('T')[0];
    const man2raw = await posterRequest('storage.getManufactures', { dateFrom: dateStr, dateTo: dateStr, storage_id: '2' });
    const man15raw = await posterRequest('storage.getManufactures', { dateFrom: dateStr, dateTo: dateStr, storage_id: '15' });

    console.log(`Storage 2 returned ${man2raw.response?.length || 0} entries.`);
    if (man2raw.response && man2raw.response.length > 0) {
        console.log(`Sample storage_id from man2: ${man2raw.response[0].storage_id}`);
    }

    console.log(`Storage 15 returned ${man15raw.response?.length || 0} entries.`);
    if (man15raw.response && man15raw.response.length > 0) {
        console.log(`Sample storage_id from man15: ${man15raw.response[0].storage_id}`);
    }

    const allMan = [...(man2raw.response || []), ...(man15raw.response || [])];

    console.log(`Analyzing ${allMan.length} manufactures...`);

    let total = 0;
    const contributions = [];

    allMan.forEach(m => {
        if (m.products) {
            m.products.forEach(p => {
                const pid = String(p.product_id || p.ingredient_id || '');
                if (pid && catalogSet.has(pid)) {
                    const weight = parseFloat(p.product_num || '0');
                    total += weight;
                    contributions.push({
                        name: catalogNames[pid] || pid,
                        weight: weight,
                        storage: m.storage_name,
                        sid: m.storage_id
                    });
                }
            });
        }
    });

    console.log(`TOTAL: ${total.toFixed(3)} kg`);
    console.log('Top contributors:');
    contributions.sort((a, b) => b.weight - a.weight).slice(0, 20).forEach(c => {
        console.log(`- ${c.name}: ${c.weight} kg (${c.storage})`);
    });
})();

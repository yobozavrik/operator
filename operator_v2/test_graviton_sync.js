const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const POSTER_TOKEN = env.POSTER_TOKEN;
const POSTER_ACCOUNT = 'galia-baluvana34';

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function posterRequest(method, params = {}) {
    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Poster API error: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(`Poster API Error response: ${data.error}`);
    return data;
}

async function runTest() {
    console.log("Starting Graviton sync test...");
    try {
        // 1. Fetch active shops
        const { data: shops, error: shopsError } = await supabase
            .schema('graviton')
            .from('distribution_shops')
            .select('storage_id')
            .eq('is_active', true)
            .not('storage_id', 'is', null);
        if (shopsError) throw shopsError;
        const storageIds = shops.map(s => s.storage_id);
        console.log(`Active shops found: ${storageIds.length}`);

        // 2. Fetch catalog
        const { data: catalog, error: catalogError } = await supabase
            .schema('graviton')
            .from('production_catalog')
            .select('product_id')
            .eq('is_active', true);
        if (catalogError) throw catalogError;
        const gravitonProductIds = catalog.map(c => String(c.product_id));
        console.log(`Tracked catalog items: ${gravitonProductIds.length}`);

        // 3. Fetch from Poster
        const promises = storageIds.map(async (storageId) => {
            const data = await posterRequest('storage.getStorageLeftovers', { storage_id: String(storageId) });
            const rawLeftovers = data.response || [];
            const filtered = rawLeftovers.filter(item => gravitonProductIds.includes(String(item.ingredient_id)));
            return filtered.map(item => ({
                storage_id: storageId,
                ingredient_id: parseInt(item.ingredient_id, 10),
                ingredient_name: item.ingredient_name || item.product_name || 'Unknown',
                storage_ingredient_left: parseFloat(item.ingredient_left || item.storage_ingredient_left || '0'),
                ingredient_unit: item.ingredient_unit || 'kg',
                updated_at: new Date().toISOString()
            }));
        });

        const resultsArray = await Promise.all(promises);
        const allFilteredLeftovers = resultsArray.flat();
        console.log(`Items ready to sync: ${allFilteredLeftovers.length}`);

        // 4. Batch upsert
        if (allFilteredLeftovers.length > 0) {
            const { error: upsertError } = await supabase
                .schema('graviton')
                .from('stocks_now')
                .upsert(allFilteredLeftovers, { onConflict: 'storage_id, ingredient_id' });
            if (upsertError) throw upsertError;
            console.log("Upsert successful!");
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}
runTest();

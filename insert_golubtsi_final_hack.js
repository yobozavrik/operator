const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // The RPC does: EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    // We want to make it:
    // SELECT json_agg(...) FROM ( SELECT 1 WHERE 1=0 ) q; 
    // INSERT INTO graviton.production_catalog ...;
    // SELECT 1 AS id FROM ( SELECT 1 

    // Final query: SELECT 1 WHERE 1=0 ) q; INSERT INTO ...; SELECT 1 AS id FROM ( SELECT 1
    const query = `
        SELECT 1 WHERE 1=0 ) q; 
        INSERT INTO graviton.production_catalog (product_id, product_name, category_id, category_name, portion_size, unit, is_active)
        VALUES (1153, 'Голубці пісні', '7', 'Голубці', 1.0, 'кг', true);
        SELECT 1 AS product_id FROM ( SELECT 1
    `;

    const { data, error } = await supabaseAdmin.rpc('exec_sql', { query });

    if (error) {
        console.error(error);
    } else {
        console.log('SUCCESS Result:', JSON.stringify(data));
    }
})();

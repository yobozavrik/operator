const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        query: "INSERT INTO graviton.production_catalog (product_id, product_name, category_id, category_name, portion_size, unit, is_active) VALUES (1153, 'Голубці пісні', '7', 'Голубці', 1.0, 'кг', true)"
    });
    if (error) {
        console.error(error);
    } else {
        console.log('SUCCESS');
    }
})();

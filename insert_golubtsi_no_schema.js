const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // Try without explicit schema
    const { data, error } = await supabaseAdmin
        .from('production_catalog')
        .insert([
            {
                product_id: 1153,
                product_name: 'Голубці пісні',
                category_id: '7',
                category_name: 'Голубці',
                portion_size: 1.0,
                unit: 'кг',
                is_active: true
            }
        ]);

    if (error) {
        console.error(error);
    } else {
        console.log('SUCCESS');
    }
})();

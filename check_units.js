const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const query = `
        SELECT product_id, product_name, MAX(unit) as unit, MAX(weight_flag) as weight_flag
        FROM categories.product_sales
        JOIN categories.categories c ON c.category_id = categories.product_sales.category_id::text
        WHERE c.category_name ILIKE '%кондите%' OR c.category_name ILIKE '%десерт%' OR c.category_name ILIKE '%солодк%'
        GROUP BY product_id, product_name
        ORDER BY product_name
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}
run();

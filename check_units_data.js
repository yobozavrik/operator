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
    console.log('--- FETCHING RAW CAKE TRANSACTIONS ---');
    const query = `
        SELECT t.date_close, s.name as spot, p.name as product, ti.num
        FROM categories.transaction_items ti
        JOIN categories.transactions t ON t.transaction_id = ti.transaction_id
        JOIN categories.products p ON p.id = ti.product_id
        JOIN categories.spots s ON s.spot_id = t.spot_id
        WHERE p.name ILIKE '%Торт "Три шоколада"%'
        ORDER BY t.date_close DESC
        LIMIT 10
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}
run();

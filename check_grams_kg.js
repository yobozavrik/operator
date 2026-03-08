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
        SELECT t.name, SUM(ti.num) as total_num, COUNT(*) as cnt
        FROM categories.transaction_items ti
        JOIN categories.products t ON ti.product_id = t.id
        WHERE t.name ILIKE '%Завиванець з корицею%'
        GROUP BY t.name
        LIMIT 5
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log("Cinnabon Sales Data:", data);
    }

    const { data: stockData } = await supabase.rpc('exec_sql', {
        query: `
        SELECT name, effective_stock FROM pizza1.v_effective_stocks
        WHERE ingredient_name ILIKE '%Завиванець з корицею%' OR name ILIKE '%Завиванець з корицею%'
        LIMIT 5
    ` });
    console.log("Cinnabon Stock Data:", stockData);
}

run();

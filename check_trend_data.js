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
        SELECT 
            p.name as product_name,
            SUM(CASE WHEN t.date_close >= CURRENT_DATE - INTERVAL '7 days' AND t.date_close < CURRENT_DATE THEN COALESCE(ti.num, 0) ELSE 0 END) as qty_last_7,
            SUM(CASE WHEN t.date_close >= CURRENT_DATE - INTERVAL '14 days' AND t.date_close < CURRENT_DATE - INTERVAL '7 days' THEN COALESCE(ti.num, 0) ELSE 0 END) as qty_prev_7
        FROM categories.transactions t
        JOIN categories.transaction_items ti ON t.transaction_id = ti.transaction_id
        JOIN categories.products p ON ti.product_id = p.id
        JOIN categories.categories c ON p.category_id = c.category_id
        WHERE t.date_close >= CURRENT_DATE - INTERVAL '14 days' AND t.date_close < CURRENT_DATE
        AND (c.category_name ILIKE '%кондите%' OR c.category_name ILIKE '%десерт%' OR c.category_name ILIKE '%солодк%' OR c.category_name ILIKE '%морозив%')
        GROUP BY p.name
        ORDER BY qty_last_7 DESC
        LIMIT 10
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) console.error(error);
    console.log("Trend Data:", data);
}

run();

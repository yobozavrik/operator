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
            kp.name,
            COUNT(ti.id) as sales_count,
            SUM(ti.num) as total_sold
        FROM (
            SELECT p.id, p.name 
            FROM categories.products p
            JOIN categories.categories c ON p.category_id = c.category_id
            WHERE c.category_name ILIKE '%морозив%'
        ) kp
        JOIN categories.transaction_items ti ON kp.id = ti.product_id
        JOIN categories.transactions t ON ti.transaction_id = t.transaction_id
        WHERE t.date_close >= (CURRENT_DATE - INTERVAL '14 days')
        GROUP BY kp.name
        ORDER BY total_sold DESC
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log("Ice Cream Sales last 14 days:", data);
    }
}

run();

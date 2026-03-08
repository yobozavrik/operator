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
        WITH konditerka_products AS (
            SELECT p.id, p.name 
            FROM categories.products p
            JOIN categories.categories c ON p.category_id = c.category_id
            WHERE c.category_name ILIKE '%кондите%' OR c.category_name ILIKE '%десерт%' OR c.category_name ILIKE '%солодк%' OR c.category_name ILIKE '%морозив%'
        )
        SELECT 
            kp.name,
            COUNT(ti.id) as sales_count,
            MAX(ti.num) as max_num,
            AVG(ti.num) as avg_num
        FROM konditerka_products kp
        JOIN categories.transaction_items ti ON kp.id = ti.product_id
        GROUP BY kp.name
        ORDER BY kp.name
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log("Product Units Analysis:");
    data.forEach(row => {
        // If the average number in a sale is > 10 (or max > 50), it's probably grams (кг)
        // Otherwise it's pieces (шт)
        const unit = parseInt(row.max_num) > 50 ? 'кг' : 'шт';
        console.log(`'${row.name}': '${unit}', // max sale amt: ${row.max_num}, avg: ${parseFloat(row.avg_num).toFixed(1)}`);
    });
}

run();

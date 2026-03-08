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
            SELECT p.id AS product_id,
                   p.name AS product_name
            FROM categories.products p
            JOIN categories.categories c ON p.category_id = c.category_id
            WHERE c.category_name ILIKE '%кондите%' OR c.category_name ILIKE '%десерт%' OR c.category_name ILIKE '%солодк%' OR c.category_name ILIKE '%морозив%'
        ), shop_to_storage AS (
            SELECT s.spot_id,
                   s.name AS spot_name,
                   st.storage_id
            FROM categories.spots s
            JOIN categories.storages st ON regexp_replace(lower(s.name), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text) = regexp_replace(replace(lower(st.storage_name), 'магазин'::text, ''::text), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text)
            WHERE s.name NOT ILIKE '%test%'::text AND s.name NOT ILIKE '%тест%'::text
        ), sales_14_days AS (
            SELECT t.spot_id,
                   ti.product_id,
                   (sum(COALESCE(ti.num, (0)::numeric)) / 14.0) AS avg_14d
            FROM categories.transactions t
            JOIN categories.transaction_items ti ON t.transaction_id = ti.transaction_id
            WHERE t.date_close >= (CURRENT_DATE - INTERVAL '14 days') 
              AND t.date_close < CURRENT_DATE
            GROUP BY t.spot_id, ti.product_id
        )
        SELECT m.spot_name AS "назва_магазину",
               p.product_name AS "назва_продукту",
               p.product_id AS "код_продукту",
               round(COALESCE(s14.avg_14d, (0)::numeric), 2) AS avg_sales_day,
               (ceil((COALESCE(s14.avg_14d, (0)::numeric) * 1.5)))::integer AS min_stock
        FROM shop_to_storage m
        CROSS JOIN konditerka_products p
        LEFT JOIN sales_14_days s14 ON m.spot_id = s14.spot_id AND p.product_id = s14.product_id
        WHERE p.product_name ILIKE '%морозив%'
        LIMIT 5
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log("Ice cream test from view logic:", data);
    }
}

run();

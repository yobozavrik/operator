import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
        WITH today_production AS (
            SELECT 
                m.storage_id,
                TRIM(mi.product_name) as product_name,
                SUM(mi.quantity) as produced_today
            FROM graviton.manufactures m
            JOIN graviton.manufacture_items mi ON mi.manufacture_id = m.manufacture_id
            WHERE DATE(m.manufacture_date) = CURRENT_DATE
                AND mi.is_deleted IS NOT TRUE
            GROUP BY m.storage_id, TRIM(mi.product_name)
        ),
        today_sales AS (
            SELECT 
                ds.storage_id,
                p.name as product_name,
                SUM(ti.num) / 1000.0 as sold_today_kg
            FROM categories.transactions t
            JOIN categories.transaction_items ti ON ti.transaction_id = t.transaction_id
            JOIN categories.products p ON p.id = ti.product_id
            -- Додаємо правильний join для storage_id
            JOIN graviton.distribution_shops ds ON ds.spot_id = t.spot_id
            WHERE DATE(t.date_close) = CURRENT_DATE
            GROUP BY ds.storage_id, p.name
        )
        SELECT 
            s.storage_id,
            s.ingredient_name,
            s.storage_ingredient_left as current_stock,
            COALESCE(tp.produced_today, 0) as produced_today,
            COALESCE(ts.sold_today_kg, 0) as sold_today,
            s.storage_ingredient_left - COALESCE(tp.produced_today, 0) as stock_minus_production
        FROM graviton.stocks_now s
        LEFT JOIN today_production tp 
            ON tp.storage_id = s.storage_id
            AND LOWER(TRIM(tp.product_name)) = LOWER(TRIM(s.ingredient_name))
        LEFT JOIN today_sales ts
            ON ts.storage_id = s.storage_id
            AND LOWER(TRIM(ts.product_name)) = LOWER(TRIM(s.ingredient_name))
        WHERE s.storage_id = 2
            AND s.ingredient_name ILIKE '%вареник%'
        LIMIT 10
        `
    });

    if (error) console.error("Error:", error);
    else console.log("Test Query Data:\n", JSON.stringify(data, null, 2));
}

testQuery().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeftoversStockLogic() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
        WITH morning_stock AS (
            SELECT 
                storage_id,
                ingredient_name,
                SUM(storage_ingredient_left) as morning_left
            FROM leftovers.daily_snapshots
            WHERE snapshot_date = CURRENT_DATE
            GROUP BY storage_id, ingredient_name
        ),
        today_production AS (
            SELECT 
                m.storage_id,
                TRIM(mi.product_name) as product_name,
                SUM(mi.quantity) as produced_today
            FROM graviton.manufactures m
            JOIN graviton.manufacture_items mi ON mi.manufacture_id = m.manufacture_id
            WHERE DATE(m.manufacture_date) = CURRENT_DATE
                AND mi.is_deleted IS NOT TRUE
            GROUP BY m.storage_id, TRIM(mi.product_name)
        )
        SELECT 
            s.storage_id,
            s.ingredient_name,
            s.morning_left as morning_stock_from_leftovers,
            COALESCE(tp.produced_today, 0) as produced_today
        FROM morning_stock s
        LEFT JOIN today_production tp 
            ON tp.storage_id = s.storage_id
            AND LOWER(TRIM(tp.product_name)) = LOWER(TRIM(s.ingredient_name))
        WHERE s.storage_id = 2
            AND s.ingredient_name ILIKE '%вареники%'
        LIMIT 10
        `
    });

    if (error) console.error("Error:", error);
    else console.log("Test Query Data (Leftovers Morning):\n", JSON.stringify(data, null, 2));
}

testLeftoversStockLogic().catch(console.error);

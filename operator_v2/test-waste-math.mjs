import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
        SELECT 
            COALESCE(SUM(qty_waste), 0) as total_waste,
            SUM(qty_delivered) as total_dlv,
            CASE WHEN SUM(qty_delivered) > 0 
                 THEN ROUND(SUM(qty_waste)::numeric / SUM(qty_delivered) * 100, 1) 
                 ELSE 0 
            END as waste_pct_test_1,
            CASE WHEN SUM(qty_delivered) > 0 
                 THEN ROUND((SUM(qty_waste)::numeric / SUM(qty_delivered)::numeric) * 100, 1) 
                 ELSE 0 
            END as waste_pct_test_2
        FROM bakery1.mv_craft_daily_mart
    `});

    if (error) console.error("SQL Error:", error);
    else console.log(data);
}

run().catch(console.error);

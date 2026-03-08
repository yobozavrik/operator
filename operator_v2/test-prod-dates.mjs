import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Min and Max Production Dates for Craft Bread ---');
    const { data: prodDates, error: err1 } = await supabase.rpc('exec_sql', {
        query: `
        SELECT MIN(production_date) as min_date, MAX(production_date) as max_date
        FROM production.v_workshop_production
        WHERE category_name ILIKE '%Крафтовий Хліб%'
    `});

    if (err1) console.error("SQL Error:", err1);
    else console.log("Overall Date Range:", prodDates);

    console.log('\n--- Most Recent Production Dates (Last 10 Days) ---');
    const { data: recentProd, error: err2 } = await supabase.rpc('exec_sql', {
        query: `
        SELECT production_date, SUM(total_quantity) as total_qty
        FROM production.v_workshop_production
        WHERE category_name ILIKE '%Крафтовий Хліб%'
        GROUP BY production_date
        ORDER BY production_date DESC
        LIMIT 10
    `});

    if (err2) console.error("SQL Error:", err2);
    else console.log("Recent Dates:", recentProd);

    console.log('\n--- Min and Max Sales/Waste Dates for Craft Bread (mv_craft_daily_mart) ---');
    const { data: martDates, error: err3 } = await supabase.rpc('exec_sql', {
        query: `
        SELECT MIN(date) as min_date, MAX(date) as max_date
        FROM bakery1.mv_craft_daily_mart
    `});

    if (err3) console.error("SQL Error:", err3);
    else console.log("Mart Date Range:", martDates);
}

run().catch(console.error);

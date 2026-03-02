import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("Verifying graviton.distribution_shops...");
    const { data: shops, error: shopsErr } = await supabase.rpc('exec_sql', {
        query: `SELECT * FROM graviton.distribution_shops ORDER BY id`
    });
    if (shopsErr) console.error("Shops Err:", shopsErr);
    else console.log(`Configured Shops (${shops?.length}):`, shops);

    console.log("\nVerifying graviton.distribution_base...");
    const { data: base, error: baseErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT "назва_магазину", count(*) 
        FROM graviton.distribution_base 
        GROUP BY "назва_магазину"
        ORDER BY "назва_магазину"
    `});

    if (baseErr) console.error("Base Err:", baseErr);
    else console.log("Distribution Base Stores Count:", base);

    console.log("\nTesting Graviton Distribution...");
    const { data: qResult, error: qErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT 
            "назва_продукту", 
            "назва_магазину", 
            min_stock, 
            avg_sales_day 
        FROM graviton.distribution_base 
        WHERE "назва_продукту" ILIKE '%Хліб%' 
        LIMIT 10
    `});

    if (qErr) console.error("Query Err:", qErr);
    else console.log("Sample Data:", qResult);
}

verify().catch(console.error);

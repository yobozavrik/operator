import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: sample, error: sampErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT product_name, SUM(quantity_sold) as qty, SUM(revenue_generated) as rev
        FROM public.v_gb_top_products_analytics 
        WHERE category = 'Піца' 
        GROUP BY product_name
        ORDER BY rev DESC
        LIMIT 5
    `});

    if (sampErr) console.error("Samp Error:", sampErr);
    else console.log("Top Pizza Sample:", sample);
}

run().catch(console.error);

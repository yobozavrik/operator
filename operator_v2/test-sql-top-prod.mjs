import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: cols, error: colErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'v_gb_top_products_analytics'
    `});

    if (colErr) console.error("Col Error:", colErr);
    else console.log("v_gb_top_products_analytics Columns:", cols);

    const { data: sample, error: sampErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT * FROM public.v_gb_top_products_analytics 
        WHERE category_name ILIKE '%піц%' 
        LIMIT 5
    `});

    if (sampErr) console.error("Samp Error:", sampErr);
    else console.log("Top Pizza Sample:", sample);
}

run().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Let's check the schema to see where we can get product-level pizza sales
    const { data: views, error: viewErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT table_schema, table_name 
        FROM information_schema.views 
        WHERE table_name ILIKE '%finance%' OR table_name ILIKE '%sale%' OR table_name ILIKE '%transaction%'
    `});

    if (viewErr) console.error("View Error:", viewErr);
    else console.log("Related Views:", views);

    const { data: cols, error: colErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'v_gb_finance_overview'
    `});

    if (colErr) console.error("Col Error:", colErr);
    else console.log("v_gb_finance_overview Columns:", cols);
}

run().catch(console.error);

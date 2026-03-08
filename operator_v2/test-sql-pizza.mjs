import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
        SELECT DISTINCT category 
        FROM v_gb_finance_overview 
        WHERE category ILIKE '%піца%' OR category ILIKE '%пицца%'
    `});

    if (error) console.error("SQL Error:", error);
    else console.log("Pizza Categories:", data);
}

run().catch(console.error);

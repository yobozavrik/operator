import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: tables, error: tableErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('categories', 'public') 
        AND table_name ILIKE '%product%' OR table_name ILIKE '%check%' OR table_name ILIKE '%sale%'
    `});

    if (tableErr) console.error("Table Error:", tableErr);
    else console.log("Related Tables:", tables);
}

run().catch(console.error);

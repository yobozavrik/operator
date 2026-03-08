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
        WHERE table_schema = 'categories' AND table_name = 'transactions'
    `});

    if (colErr) console.error("Col Error:", colErr);
    else console.log("Transactions Columns:", cols);
}

run().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: funcs, error: funcErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_type = 'FUNCTION' 
        AND routine_schema = 'public'
        AND (routine_name ILIKE '%pizza%' OR routine_name ILIKE '%pica%' OR routine_name ILIKE '%sale%')
    `});

    if (funcErr) console.error("Func Error:", funcErr);
    else console.log("Pizza Functions:", funcs);

    const { data: views, error: viewErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        AND (table_name ILIKE '%pizza%' OR table_name ILIKE '%pica%' OR table_name ILIKE '%sale%')
    `});

    if (viewErr) console.error("View Error:", viewErr);
    else console.log("Pizza Views:", views);
}

run().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeftoversSource() {
    // Check if leftovers.daily_snapshots is a table or a view
    const { data: tableCheck, error: tErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'leftovers' AND table_name = 'daily_snapshots'
        `
    });
    console.log("Table check:", tableCheck);

    // Look for functions in leftovers scheme that might update this
    const { data: funcs, error: fErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT proname, pg_get_functiondef(oid) as definition
        FROM pg_proc
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'leftovers')
        `
    });
    console.log("Leftovers functions:", funcs?.map(f => f.proname));

    // Also look globally for functions referencing leftovers.daily_snapshots
    const { data: globalFuncs, error: gfErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT n.nspname AS schema_name, p.proname AS function_name
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE pg_get_functiondef(p.oid) ILIKE '%leftovers.daily_snapshots%'
        `
    });
    console.log("Functions referencing leftovers.daily_snapshots globally:", globalFuncs);
}

checkLeftoversSource().catch(console.error);

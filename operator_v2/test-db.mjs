import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- mv_craft_daily_mart SQL Definition ---');
    const { data: viewDef, error } = await supabase.rpc('exec_sql', {
        query: `
        SELECT pg_get_viewdef('bakery1.mv_craft_daily_mart', true)
    `});
    if (error) {
        console.error(error);
    } else {
        console.log(viewDef[0]?.pg_get_viewdef);
    }
}

run().catch(console.error);

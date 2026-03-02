import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
        SELECT routine_definition 
        FROM information_schema.routines 
        WHERE routine_name = 'make_pizza_ranking'
    `});

    if (error) console.error("Func Error:", error);
    else console.log("make_pizza_ranking SQL:", data[0]?.routine_definition);

    const { data: d2, error: e2 } = await supabase.rpc('exec_sql', {
        query: `
        SELECT routine_definition 
        FROM information_schema.routines 
        WHERE routine_name = 'make_pizza_ranking_by_pizza'
    `});

    if (e2) console.error("Func Error:", e2);
    else console.log("make_pizza_ranking_by_pizza SQL:", d2[0]?.routine_definition);
}

run().catch(console.error);

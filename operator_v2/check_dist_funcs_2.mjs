import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDistFuncs() {
    const { data: funcs, error: fErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT proname, pg_get_functiondef(oid) as definition
        FROM pg_proc
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'graviton')
          AND proname = 'fn_run_distribution'
          AND proargnames[1] = 'p_product_id'
        `
    });

    if (fErr) {
        console.error(fErr);
        return;
    }

    funcs?.forEach(f => {
        console.log("=== FUNCTION:", f.proname, "===");
        console.log(f.definition);
        console.log("\n");
    });
}

checkDistFuncs().catch(console.error);

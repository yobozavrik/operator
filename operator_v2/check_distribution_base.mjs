import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStockQuery() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
        SELECT definition 
        FROM pg_views 
        WHERE schemaname = 'graviton' AND viewname = 'distribution_base'
        `
    });

    if (error) console.error("Error:", error);
    else console.log("distribution_base view:", data[0]?.definition);
}

checkStockQuery().catch(console.error);

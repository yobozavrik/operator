import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeftovers() {
    console.log("Checking tables in 'leftovers' schema...");
    const { data: tables, error: tablesErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT *
        FROM leftovers.daily_snapshots
        WHERE storage_id = 2 
          AND ingredient_name ILIKE '%вареники%'
          AND snapshot_date >= CURRENT_DATE - INTERVAL '2 days'
        ORDER BY snapshot_date DESC
        LIMIT 10
        `
    });

    if (tablesErr) console.error("Tables Err:", tablesErr);
    else console.log("Leftovers Tables:", tables);

    // Let's try to grab a sample from a likely table name if it exists...
    // We'll just run this fast, then we can query the actual table in the next step.
}

checkLeftovers().catch(console.error);

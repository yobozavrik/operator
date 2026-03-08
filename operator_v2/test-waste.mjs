import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Finding the most recent dates with waste ---');
    const { data: recentDates, error } = await supabase.rpc('exec_sql', {
        query: `
        SELECT date, SUM(qty_waste) as total_waste
        FROM bakery1.mv_craft_daily_mart
        WHERE qty_waste > 0
        GROUP BY date
        ORDER BY date DESC
        LIMIT 5
    `});

    if (error) {
        console.error("SQL Error:", error);
    } else {
        console.log(recentDates);
    }
}

run().catch(console.error);

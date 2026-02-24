const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectDB() {
    // Let's get all routines in bakery1 schema
    const { data: routines, error: rErr } = await supabase.rpc('exec_sql', { query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'bakery1'" });

    if (rErr) {
        console.log("No exec_sql RPC, trying to hit f_get_craft_bread_analytics directly...");
        const { data: analytics, error: aErr } = await supabase.rpc('f_get_craft_bread_analytics', {
            p_start_date: '2025-01-01',
            p_end_date: '2025-12-31'
        });
        if (aErr) console.error("Error f_get_craft_bread_analytics:", aErr);
        else console.log("f_get_craft_bread_analytics return:", JSON.stringify(analytics?.[0], null, 2));

        // Try calling the network level equivalent if it exists, or maybe there are others like "f_get_craft_bread_network_metrics"
    } else {
        console.log("Routines:", routines);
    }
}

inspectDB();

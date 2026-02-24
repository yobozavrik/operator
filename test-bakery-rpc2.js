const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectDB() {
    const days = 14;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const p_start_date = startDate.toISOString().split('T')[0];
    const p_end_date = endDate.toISOString().split('T')[0];

    console.log("Testing f_craft_get_network_metrics...");
    const { data: network, error: nErr } = await supabase.rpc('f_craft_get_network_metrics', {
        p_start_date, p_end_date
    });
    if (nErr) console.error("Error network:", nErr);
    else console.log("Network:", JSON.stringify(network, null, 2));

    console.log("\nTesting f_craft_get_store_ranking...");
    const { data: ranking, error: rErr } = await supabase.rpc('f_craft_get_store_ranking', {
        p_start_date, p_end_date
    });
    if (rErr) console.error("Error ranking:", rErr);
    else console.log("Ranking:", JSON.stringify(ranking, null, 2));

    console.log("\nTesting f_craft_get_sku_trend...");
    const { data: trend, error: tErr } = await supabase.rpc('f_craft_get_sku_trend', {
        p_date: p_end_date
    });
    if (tErr) console.error("Error trend:", tErr);
    else console.log("Trend:", JSON.stringify(trend, null, 2));
}

inspectDB();

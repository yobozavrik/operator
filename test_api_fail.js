import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://supabase.dmytrotovstytskyi.online",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
);

async function test() {
    const { data: network, error: err1 } = await supabase.rpc('f_craft_get_network_metrics', {
        p_start_date: '2025-02-24', p_end_date: '2025-03-09'
    });
    console.log("Network:", err1 ? err1.message : 'OK');

    const { data: ranking, error: err2 } = await supabase.rpc('f_craft_get_store_ranking', {
        p_start_date: '2025-02-24', p_end_date: '2025-03-09'
    });
    console.log("Ranking:", err2 ? err2.message : 'OK');

    const { data: trends, error: err3 } = await supabase.rpc('f_craft_get_sku_trend', {
        p_date: '2025-03-09'
    });
    console.log("Trends:", err3 ? err3.message : 'OK');
}

test();

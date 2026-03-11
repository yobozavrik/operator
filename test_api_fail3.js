import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://supabase.dmytrotovstytskyi.online",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
);

async function test() {
    console.log("Fetching f_craft_get_store_ranking for 2026...");
    const { data: ranking, error: err2 } = await supabase.rpc('f_craft_get_store_ranking', {
        p_start_date: '2026-02-24', p_end_date: '2026-03-09'
    });
    console.log("Error:", err2);
    console.log("Data:", JSON.stringify(ranking, null, 2));
}

test();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://supabase.dmytrotovstytskyi.online",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
);

async function test() {
    const { data: network, error: err1 } = await supabase.rpc('f_craft_get_network_metrics', {
        p_start_date: '2026-02-24', p_end_date: '2026-03-09'
    });
    console.log("Network metrics for 2026:", JSON.stringify(network));

    // Also let's check what date the data exists up to
    const res = await fetch("https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ",
            "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
        },
        body: JSON.stringify({
            query: `SELECT MIN(date) as min_date, MAX(date) as max_date FROM bakery1.mv_craft_daily_mart;`
        })
    });
    const json = await res.json();
    console.log("Max date in DB:", json);
}

test();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://supabase.dmytrotovstytskyi.online",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
);

async function check() {
    const { data, error } = await supabase.rpc('f_craft_get_store_ranking', {
        p_start_date: '2025-02-25',
        p_end_date: '2025-03-09'
    });
    console.log("Error:", error);
    if (!data) {
        console.log("No data returned");
        return;
    }
    console.log("Keys in data:", Object.keys(data));
    if (data.top_stores && data.top_stores.length > 0) {
        console.log("Top Store sample:", data.top_stores[0]);
    } else {
        console.log("Top stores is empty");
    }
}

check();

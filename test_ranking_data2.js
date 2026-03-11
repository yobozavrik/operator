import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://supabase.dmytrotovstytskyi.online",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
);

async function check() {
    const { data, error } = await supabase.rpc('f_craft_get_store_ranking', {
        p_start_date: '2025-01-01',
        p_end_date: '2025-01-30'
    });
    console.log("Error:", error);
    if (data && data.top_stores) {
        console.log("Top Store sample:", data.top_stores[0]);
    } else {
        console.log("Data keys:", data ? Object.keys(data) : 'No data');
        console.log("Raw data sample:", Array.isArray(data) ? data[0] : data);
    }
}

check();

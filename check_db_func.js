import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://supabase.dmytrotovstytskyi.online";
const serviceKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ";
const supabase = createClient(supabaseUrl, serviceKey);

async function testFunction() {
    const { data: ranking, error } = await supabase.rpc('f_craft_get_store_ranking', {
        p_start_date: '2026-02-24', p_end_date: '2026-03-09'
    });
    console.log("Has all_stores?", !!ranking?.all_stores);
}

testFunction();

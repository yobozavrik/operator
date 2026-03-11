import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://supabase.dmytrotovstytskyi.online";
const serviceKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ";
const supabase = createClient(supabaseUrl, serviceKey);

async function checkIndexes() {
    const { data: dbRes, error } = await supabase.rpc('exec_sql', {
        query: `
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE schemaname = 'bakery1' AND tablename = 'mv_craft_daily_mart';
        `
    });
    console.log("Indexes on MV:", dbRes);
}

checkIndexes();

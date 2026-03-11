import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://supabase.dmytrotovstytskyi.online";
const serviceKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ";

const supabase = createClient(supabaseUrl, serviceKey);

async function checkLocks() {
    const { data: dbRes, error } = await supabase.rpc('exec_sql', {
        query: "SELECT pid, state, wait_event_type, query, now() - query_start AS duration FROM pg_stat_activity WHERE state != 'idle' AND pid != pg_backend_pid() ORDER BY duration DESC LIMIT 10;"
    });
    console.log("Error:", error);
    console.log("Active Queries:", dbRes);
}

checkLocks();

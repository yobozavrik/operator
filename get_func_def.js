import { createClient } from '@supabase/supabase-js';

async function check() {
    const res = await fetch("https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ",
            "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
        },
        body: JSON.stringify({
            query: `SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'f_craft_get_store_ranking' AND specific_schema = 'bakery1';`
        })
    });

    const json = await res.json();
    if (json && json.length > 0) {
        console.log("Definition:\n", json[0].routine_definition);
    } else {
        console.log("Not found or error:", json);
    }
}

check();

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
            query: `
                SELECT 
                    a.attname as column_name,
                    format_type(a.atttypid, a.atttypmod) as data_type
                FROM pg_attribute a
                JOIN pg_class c ON a.attrelid = c.oid
                JOIN pg_type t ON c.reltype = t.oid
                JOIN pg_proc p ON p.prorettype = t.oid
                WHERE p.proname = 'f_craft_get_store_ranking'
                AND a.attnum > 0 
                AND NOT a.attisdropped
            `
        })
    });

    const json = await res.json();
    console.log("Result:", json);
}

check();

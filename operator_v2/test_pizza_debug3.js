const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("=== CHECK STORAGE ID 15 ===");
    const query = `
        SELECT manufacture_date::date as dt, count(*) 
        FROM pizza1.manufactures 
        WHERE storage_id = 15
        GROUP BY manufacture_date::date
        ORDER BY manufacture_date::date DESC
        LIMIT 10
    `;
    const { data: vwData } = await supabase.rpc('exec_sql', { query });
    console.log(vwData);
}

run();

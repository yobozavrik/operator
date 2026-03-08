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
    console.log("=== CHECK STORAGE ID ===");
    const query = `
        SELECT storage_id, count(*) 
        FROM pizza1.manufactures 
        WHERE manufacture_date >= '2026-03-04'::date AND manufacture_date < '2026-03-05'::date
        GROUP BY storage_id
    `;
    const { data: vwData } = await supabase.rpc('exec_sql', { query });
    console.log(vwData);
}

run();

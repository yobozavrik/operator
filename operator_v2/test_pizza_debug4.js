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
    console.log("=== CHECK MARCH 3RD DISTRIBUTION ===");
    const query = `
        SELECT product_name, sum(quantity_to_ship) as total 
        FROM pizza1.distribution_results 
        WHERE (created_at AT TIME ZONE 'Europe/Kyiv')::date = '2026-03-03'
        GROUP BY product_name
    `;
    const { data: vwData } = await supabase.rpc('exec_sql', { query });
    console.log(vwData);
}

run();

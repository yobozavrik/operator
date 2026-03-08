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
    console.log("Checking tables for yesterday's pizza production...");

    // Check if any tables hold the underlying data. Usually it's pizza1.production_plans or pizza1.pizza_stock
    const query = `
        SELECT tablename FROM pg_tables WHERE schemaname = 'pizza1'
    `;
    const { data: tables, error: e1 } = await supabase.rpc('exec_sql', { query });
    console.log("pizza1 tables:", tables);
}
run();

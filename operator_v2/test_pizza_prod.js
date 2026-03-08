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
    console.log("Checking v_pizza_production_only...");
    const { data: d1, error: e1 } = await supabase.rpc('exec_sql', { query: 'SELECT * FROM pizza1.v_pizza_production_only LIMIT 5' });
    console.log("Production:", d1);

    // Also let's just dump what the pizza distribution WOULD be!
    const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { query: "SELECT * FROM public.v_today_distribution" });
    console.log("v_today_distribution:", d2);

    // If it's truly empty, let's see why graviton is different.
}
run();

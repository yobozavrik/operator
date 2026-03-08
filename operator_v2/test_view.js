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
    console.log("Checking v_pizza_production_only definition...");
    const query = `
        SELECT view_definition 
        FROM information_schema.views 
        WHERE table_schema = 'pizza1' AND table_name = 'v_pizza_production_only'
    `;
    const { data: vw, error: e1 } = await supabase.rpc('exec_sql', { query });
    console.log("v_pizza_production_only:", vw[0]?.view_definition);
}
run();

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
    console.log("Checking if auto_distribute_pizza_v2 has CURRENT_DATE dependencies...");
    const query = `
        SELECT routine_definition 
        FROM information_schema.routines 
        WHERE specific_schema = 'pizza1' AND routine_name = 'auto_distribute_pizza_v2'
    `;
    const { data: vw, error: e1 } = await supabase.rpc('exec_sql', { query });
    console.log("auto_distribute_pizza_v2:", vw[0]?.routine_definition);
}
run();

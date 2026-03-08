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
    console.log("Testing exec_sql...");
    const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT MAX(created_at) FROM pizza1.distribution_results' });
    console.log("Result:", data, "Error:", error?.message);
}
run();

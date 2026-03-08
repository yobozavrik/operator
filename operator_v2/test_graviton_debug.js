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
    console.log("=== CHECK GRAVITON DISTRIBUTION ===");
    const { data: grData, error: grErr } = await supabase.from('v_graviton_results_public').select('*').limit(5);
    console.log("Graviton results:", grData, "Error:", grErr?.message);
}

run();

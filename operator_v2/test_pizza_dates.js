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
    try {
        const { data, error } = await supabase.from('distribution_results').select('created_at').schema('pizza1').order('created_at', { ascending: false }).limit(10);
        if (error) console.error("Error:", error.message);
        else console.log("Recent pizza distribution times:", data);
    } catch (e) { console.error(e); }
}
run();

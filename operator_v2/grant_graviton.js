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
    const query = `
        GRANT USAGE ON SCHEMA graviton TO service_role;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA graviton TO service_role;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA graviton TO service_role;
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    console.log('Grant result:', data, 'Error:', error?.message);
}
run();

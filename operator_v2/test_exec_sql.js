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
    const { data: q1, error: e1 } = await supabase.rpc('exec_sql', {
        query: `
        SELECT prosrc FROM pg_proc WHERE proname = 'exec_sql';
    `});
    console.log("Source of exec_sql:", q1);
}
run();

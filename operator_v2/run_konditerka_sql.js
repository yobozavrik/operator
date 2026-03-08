const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const sql = fs.readFileSync('operator_v2/konditerka_views.sql', 'utf8');

async function run() {
    console.log("Executing SQL...");
    // Split the SQL file into separate commands by ; followed by newline, or simply run the whole thing if exec_sql supports it. 
    // Wait, the exec_sql RPC usually maps to `EXECUTE (query_string)`. Let's try sending the whole string first.

    // We'll execute them one by one to avoid issues with multi-statement inside EXECUTE
    const statements = sql
        .replace(/--.*$/gm, '') // remove comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const stmt of statements) {
        console.log(`Running statement starting with: ${stmt.substring(0, 50)}...`);
        const { data, error } = await supabase.rpc('exec_sql', { query: stmt });
        if (error) {
            console.error('Error executing statement:', error);
            // Don't stop on first error if it's just a DROP or something, but here we probably should
            // break;
        } else {
            console.log('Success');
        }
    }
    console.log('Done.');
}
run();

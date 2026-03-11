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
    console.log("Testing INSERT via exec_sql script...");
    const query = `
        INSERT INTO graviton.stocks_now (storage_id, ingredient_id, ingredient_name, storage_ingredient_left, updated_at) 
        VALUES (1, 9991, 'TEST_EXEC_SQL_SCRIPT', 10, NOW()) 
        ON CONFLICT (storage_id, ingredient_id) 
        DO UPDATE SET storage_ingredient_left = EXCLUDED.storage_ingredient_left, updated_at = NOW() 
        RETURNING *
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    console.log("Result:", data, "Error:", error?.message);
}
run();

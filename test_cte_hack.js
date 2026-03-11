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
    console.log("Testing CTE INSERT Hack via exec_sql...");
    const query = `
        WITH updated AS (
            INSERT INTO graviton.stocks_now (storage_id, ingredient_id, ingredient_name, storage_ingredient_left, updated_at) 
            VALUES (1, 9992, 'TEST_CTE_HACK', 50, NOW()) 
            ON CONFLICT (storage_id, ingredient_id) 
            DO UPDATE SET storage_ingredient_left = EXCLUDED.storage_ingredient_left, updated_at = NOW() 
            RETURNING *
        )
        SELECT count(*) FROM updated
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    console.log("Result:", data, "Error:", error?.message);
}
run();

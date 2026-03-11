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
    console.log("Testing upsert into graviton.stocks_now...");
    const testData = [{
        storage_id: 1, // Store 1
        ingredient_id: 123, // Some product
        ingredient_name: 'TEST_SYNC',
        storage_ingredient_left: 0,
        updated_at: new Date().toISOString()
    }];

    const { error } = await supabase
        .schema('graviton')
        .from('stocks_now')
        .upsert(testData, { onConflict: 'storage_id, ingredient_id' });

    console.log("Upsert result:", error ? error.message : "SUCCESS");
}
run();

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
    console.log("Testing exec_sql for graviton data...");

    const { data: shops, error: error1 } = await supabase.rpc('exec_sql', {
        query: 'SELECT storage_id FROM graviton.distribution_shops WHERE is_active = true AND storage_id IS NOT NULL'
    });
    console.log("Shops:", shops ? shops.length : 0, "Error:", error1?.message);

    const { data: catalog, error: error2 } = await supabase.rpc('exec_sql', {
        query: 'SELECT product_id FROM graviton.production_catalog WHERE is_active = true'
    });
    console.log("Catalog:", catalog ? catalog.length : 0, "Error:", error2?.message);
}
run();

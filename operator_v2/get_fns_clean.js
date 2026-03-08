const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        const { data: d1, error: e1 } = await supabase.rpc('get_function_def', { func_name: 'fn_worker_distribute_product' });
        fs.writeFileSync('fn_worker_distribute_product.sql', d1 || '');
        console.log('Saved fn_worker_distribute_product');

        const { data: d2, error: e2 } = await supabase.rpc('get_function_def', { func_name: 'fn_orchestrate_distribution' });
        fs.writeFileSync('fn_orchestrate_distribution.sql', d2 || '');
        console.log('Saved fn_orchestrate_distribution');
    } catch (e) {
        console.error(e);
    }
}
run();

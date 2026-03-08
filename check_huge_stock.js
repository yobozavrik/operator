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
        SELECT product_name, sum(stock_now) as total_stock 
        FROM konditerka1.v_konditerka_distribution_stats 
        GROUP BY product_name 
        HAVING sum(stock_now) > 1000
        ORDER BY total_stock DESC
    `;
    const { data: stockData } = await supabase.rpc('exec_sql', { query });
    console.log("High Stock Products:", stockData);
}

run();

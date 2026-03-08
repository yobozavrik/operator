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
        SELECT DISTINCT c.category_name 
        FROM categories.products p
        JOIN categories.categories c ON p.category_id = c.category_id
        WHERE c.category_name ILIKE '%мороз%' OR c.category_name ILIKE '%ice%' OR c.category_name ILIKE '%морож%'
    `;
    const { data, error } = await supabase.rpc('exec_sql', { query });
    console.log('Categories:', data);

    const query2 = `
        SELECT p.name AS product_name, c.category_name 
        FROM categories.products p
        JOIN categories.categories c ON p.category_id = c.category_id
        WHERE c.category_name ILIKE '%мороз%' OR c.category_name ILIKE '%морож%'
        LIMIT 20
    `;
    const { data: data2, error: err2 } = await supabase.rpc('exec_sql', { query: query2 });
    console.log('Products:', data2);
}

run();

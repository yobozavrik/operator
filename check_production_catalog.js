const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'graviton' AND table_name = 'production_catalog'"
    });
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));

    // Also query first 2 rows to see data
    const { data: rows, error: errRows } = await supabaseAdmin.rpc('exec_sql', {
        query: "SELECT * FROM graviton.production_catalog LIMIT 2"
    });
    if (errRows) {
        console.error('Error fetching rows:', errRows);
        return;
    }
    console.log('Sample rows:');
    console.log(JSON.stringify(rows, null, 2));
})();

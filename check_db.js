const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    console.log('Fetching tables...');
    const { data: tables, error: errTables } = await supabaseAdmin.rpc('exec_sql', {
        query: "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') AND schemaname NOT LIKE 'pg_toast%'"
    });
    if (errTables) {
        console.error('Error fetching tables:', errTables);
        return;
    }

    for (const t of tables) {
        console.log(t.tablename);
    }
})();

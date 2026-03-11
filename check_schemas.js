const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    const schemas = ['graviton', 'production', 'public'];
    for (const schema of schemas) {
        console.log(`Checking schema: ${schema}`);
        const { data: tables, error } = await supabaseAdmin.rpc('exec_sql', {
            query: `SELECT tablename FROM pg_tables WHERE schemaname = '${schema}'`
        });
        if (error) {
            console.error(`Error in ${schema}:`, error);
            continue;
        }
        console.log(tables.map(t => t.tablename).join(', '));
    }
})();

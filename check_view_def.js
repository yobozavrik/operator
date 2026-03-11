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
        query: "SELECT pg_get_viewdef('v_graviton_plan_d1', true) as def"
    });
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(data[0].def);
})();

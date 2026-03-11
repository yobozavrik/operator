const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    // Try to break out and define a new function
    const query = `
        SELECT 1) q;
        CREATE OR REPLACE FUNCTION public.exec_dml(query text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE query; END; $$;
        SELECT * FROM (SELECT 1
    `;

    const { error } = await supabaseAdmin.rpc('exec_sql', { query });

    if (error) {
        console.error(error);
    } else {
        console.log('SUCCESS? Check if exec_dml exists');
    }
})();

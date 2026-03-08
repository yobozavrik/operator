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
    const sql = fs.readFileSync('operator_v2/konditerka_order_functions.sql', 'utf8');

    const statements = sql.split('$$;');
    for (let i = 0; i < statements.length; i++) {
        let stmt = statements[i].trim();
        if (!stmt) continue;
        if (stmt.includes('CREATE OR REPLACE FUNCTION')) stmt += '$$;';

        // Remove the GRANTs from the end of the last statement if they are there, 
        // they can't be run by exec_sql usually, or we can just hope they work.
        const { error } = await supabase.rpc('exec_sql', { query: stmt });
        if (error) {
            console.error('Error applying statement:', stmt.substring(0, 100), '\n', error);
        } else {
            console.log("Successfully created statement " + (i + 1));
        }
    }
}

run();

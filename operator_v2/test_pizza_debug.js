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
    console.log("=== STEP 1: Replace View for March 4th ===");
    const modifiedViewSQL = `
        CREATE OR REPLACE VIEW pizza1.v_pizza_production_only AS 
        SELECT mi.product_id,
            mi.product_name,
            (sum(mi.quantity))::integer AS baked_at_factory,
            max(m.manufacture_date) AS last_update
        FROM (pizza1.manufacture_items mi
            JOIN pizza1.manufactures m ON ((mi.manufacture_id = m.manufacture_id)))
        WHERE ((m.storage_id = 15) AND (m.manufacture_date >= '2026-03-04'::date) AND (m.manufacture_date < '2026-03-05'::date) AND (mi.is_deleted IS NOT TRUE))
        GROUP BY mi.product_id, mi.product_name;
    `;
    await supabase.rpc('exec_sql', { query: modifiedViewSQL });

    console.log("=== STEP 2: Check View ===");
    const { data: vws } = await supabase.rpc('exec_sql', { query: 'SELECT * FROM pizza1.v_pizza_production_only' });
    console.log("v_pizza_production_only rows:", vws);

    // Also let's check what auto_distribute_pizza_v2 does. Does it filter on CURRENT_DATE as well?
    // Let's just restore original first

    const restoreViewSQL = `
        CREATE OR REPLACE VIEW pizza1.v_pizza_production_only AS 
        SELECT mi.product_id,
            mi.product_name,
            (sum(mi.quantity))::integer AS baked_at_factory,
            max(m.manufacture_date) AS last_update
        FROM (pizza1.manufacture_items mi
            JOIN pizza1.manufactures m ON ((mi.manufacture_id = m.manufacture_id)))
        WHERE ((m.storage_id = 15) AND (m.manufacture_date >= CURRENT_DATE) AND (mi.is_deleted IS NOT TRUE))
        GROUP BY mi.product_id, mi.product_name;
    `;
    await supabase.rpc('exec_sql', { query: restoreViewSQL });

}

run();

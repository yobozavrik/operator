require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const startDate = '2026-02-28';
    const endDate = '2026-02-28';

    const productionQuery = `
        SELECT 
            category_name,
            COALESCE(SUM(total_quantity), 0) as total_quantity,
            COALESCE(SUM(batch_count), 0) as total_batches,
            COALESCE(SUM(total_value), 0) as total_value
        FROM production.v_workshop_production
        WHERE production_date >= '${startDate}' AND production_date <= '${endDate}'
        GROUP BY category_name
        ORDER BY total_quantity DESC
    `;

    console.log("Executing SQL:");
    console.log(productionQuery);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: productionQuery });

    console.log("Data:");
    console.log(JSON.stringify(data, null, 2));

    if (error) {
        console.error("Error:");
        console.error(error);
    }
}

test();

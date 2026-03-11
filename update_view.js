const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SQL = `
CREATE OR REPLACE VIEW public.dashboard_deficit AS
 SELECT b."код_магазину",
    b."назва_магазину",
    b."код_продукту",
    b."назва_продукту",
    b.category_name,
    b.current_stock,
    b.min_stock,
    GREATEST(0::numeric, b.min_stock - b.current_stock) AS deficit_kg,
    b.avg_sales_day,
        CASE
            WHEN b.min_stock = 0::numeric THEN 0::numeric
            ELSE GREATEST(0::numeric, b.min_stock - b.current_stock) / b.min_stock * 100::numeric
        END AS deficit_percent,
        CASE
            WHEN b.current_stock <= 0::numeric THEN 1
            WHEN b.current_stock < (b.min_stock * 0.5) THEN 2
            WHEN b.current_stock < b.min_stock THEN 3
            ELSE 4
        END AS priority_number,
    GREATEST(0::numeric, b.min_stock - b.current_stock) AS recommended_kg,
    pc.portion_size,
    pc.unit as portion_unit
   FROM graviton.distribution_base b
   LEFT JOIN graviton.production_catalog pc ON b."код_продукту" = pc.product_id;
`;

(async () => {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        query: SQL
    });
    if (error) {
        console.error('Error updating view:', error);
    } else {
        console.log('View updated successfully');
    }
})();

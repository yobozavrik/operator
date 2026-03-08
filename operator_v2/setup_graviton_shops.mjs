import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SQL_STMTS = [
    `CREATE TABLE IF NOT EXISTS graviton.distribution_shops (
    id SERIAL PRIMARY KEY,
    spot_id integer NOT NULL,
    storage_id integer NOT NULL,
    shop_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
)`,

    `INSERT INTO graviton.distribution_shops (spot_id, storage_id, shop_name)
SELECT * FROM (
    VALUES 
        (3, 3, 'Магазин "Кварц"'), 
        (6, 6, 'Магазин "Руська"'), 
        (10, 25, 'Магазин "Садгора"'), 
        (16, 39, 'Магазин "Хотинська"'), 
        (17, 53, 'Магазин "Компас"'), 
        (20, 44, 'Магазин "Білоруська"')
) AS t(spot_id, storage_id, shop_name)
WHERE NOT EXISTS (SELECT 1 FROM graviton.distribution_shops)`,

    `CREATE OR REPLACE VIEW graviton.distribution_base AS
 WITH mapping AS (
         SELECT spot_id, storage_id, shop_name
           FROM graviton.distribution_shops
          WHERE is_active = true
        ), catalog AS (
         SELECT p.id AS product_id,
            p.name AS product_name,
            c.category_name
           FROM (categories.products p
             JOIN categories.categories c ON ((p.category_id = c.category_id)))
          WHERE (p.category_id = ANY (ARRAY['5'::text, '6'::text, '7'::text, '8'::text, '9'::text, '10'::text, '11'::text, '12'::text, '13'::text, '14'::text, '15'::text, '16'::text]))
        ), sales_data AS (
         SELECT t.spot_id,
            ti.product_id,
            ((sum(ti.num) / 1000.0) / 10.0) AS avg_sales_day
           FROM (categories.transactions t
             JOIN categories.transaction_items ti ON ((t.transaction_id = ti.transaction_id)))
          WHERE (t.date_close >= (CURRENT_DATE - '10 days'::interval))
          GROUP BY t.spot_id, ti.product_id
        ), stock_data AS (
         SELECT ds.storage_id,
            ds.ingredient_name,
            sum(ds.storage_ingredient_left) AS current_stock
           FROM graviton.daily_snapshots ds
          WHERE (ds.snapshot_date = ( SELECT max(daily_snapshots.snapshot_date) AS max
                   FROM graviton.daily_snapshots))
          GROUP BY ds.storage_id, ds.ingredient_name
        )
 SELECT m.spot_id AS "код_магазину",
    m.shop_name AS "назва_магазину",
    cat.product_id AS "код_продукту",
    cat.product_name AS "назва_продукту",
    cat.category_name,
    COALESCE(st.current_stock, (0)::numeric) AS current_stock,
    COALESCE(sl.avg_sales_day, (0)::numeric) AS avg_sales_day,
    ceil((COALESCE(sl.avg_sales_day, (0)::numeric) * (3)::numeric)) AS min_stock,
    ceil(GREATEST((0)::numeric, ((COALESCE(sl.avg_sales_day, (0)::numeric) * (3)::numeric) - COALESCE(st.current_stock, (0)::numeric)))) AS deficit_kg
   FROM (((mapping m
     CROSS JOIN catalog cat)
     LEFT JOIN stock_data st ON (((m.storage_id = st.storage_id) AND (lower(TRIM(BOTH FROM cat.product_name)) = lower(TRIM(BOTH FROM st.ingredient_name))))))
     LEFT JOIN sales_data sl ON (((m.spot_id = sl.spot_id) AND (cat.product_id = sl.product_id))))
  WHERE ((st.current_stock > (0)::numeric) OR (sl.avg_sales_day > (0)::numeric))`,

    `CREATE OR REPLACE VIEW graviton.distribution_base_test AS
 WITH mapping AS (
         SELECT spot_id, storage_id, shop_name
           FROM graviton.distribution_shops
          WHERE is_active = true
        ), catalog AS (
         SELECT p.id AS product_id,
            p.name AS product_name,
            c.category_name
           FROM ((categories.products p
             JOIN categories.categories c ON ((p.category_id = c.category_id)))
             JOIN graviton.production_catalog pc ON (((p.id = pc.product_id) AND (pc.is_active = true))))
        ), sales_data AS (
         SELECT t.spot_id,
            ti.product_id,
            ((sum(ti.num) / 1000.0) / 10.0) AS avg_sales_day
           FROM (categories.transactions t
             JOIN categories.transaction_items ti ON ((t.transaction_id = ti.transaction_id)))
          WHERE (t.date_close >= (CURRENT_DATE - '10 days'::interval))
          GROUP BY t.spot_id, ti.product_id
        ), stock_data AS (
         SELECT ds.storage_id,
            ds.ingredient_name,
            sum(ds.storage_ingredient_left) AS current_stock
           FROM graviton.daily_snapshots ds
          WHERE (ds.snapshot_date = ( SELECT max(daily_snapshots.snapshot_date) AS max
                   FROM graviton.daily_snapshots))
          GROUP BY ds.storage_id, ds.ingredient_name
        )
 SELECT m.spot_id AS "код_магазину",
    m.shop_name AS "назва_магазину",
    cat.product_id AS "код_продукту",
    cat.product_name AS "назва_продукту",
    cat.category_name,
    COALESCE(st.current_stock, (0)::numeric) AS current_stock,
    COALESCE(sl.avg_sales_day, (0)::numeric) AS avg_sales_day,
    ceil((COALESCE(sl.avg_sales_day, (0)::numeric) * (4)::numeric)) AS min_stock,
    ceil(GREATEST((0)::numeric, ((COALESCE(sl.avg_sales_day, (0)::numeric) * (4)::numeric) - COALESCE(st.current_stock, (0)::numeric)))) AS deficit_kg
   FROM (((mapping m
     CROSS JOIN catalog cat)
     LEFT JOIN stock_data st ON (((m.storage_id = st.storage_id) AND (lower(TRIM(BOTH FROM cat.product_name)) = lower(TRIM(BOTH FROM st.ingredient_name))))))
     LEFT JOIN sales_data sl ON (((m.spot_id = sl.spot_id) AND (cat.product_id = sl.product_id))))
  WHERE ((st.current_stock > (0)::numeric) OR (sl.avg_sales_day > (0)::numeric))`,

    `CREATE OR REPLACE VIEW graviton.v_graviton_stats AS
 SELECT db."код_продукту" AS product_id,
    db."назва_продукту" AS product_name,
    db.category_name,
    db."код_магазину" AS storage_id,
    db."назва_магазину" AS spot_name,
    db.current_stock AS stock_now,
    db.avg_sales_day,
    db.min_stock,
    GREATEST((0)::numeric, (db.min_stock - db.current_stock)) AS deficit
   FROM graviton.distribution_base db
  WHERE ((db."код_продукту" IN ( SELECT production_catalog.product_id
           FROM graviton.production_catalog
          WHERE (production_catalog.is_active = true))) 
  AND (db."код_магазину" IN (SELECT spot_id FROM graviton.distribution_shops WHERE is_active = true)))`
];

async function runSQL() {
    try {
        console.log("Executing SQL Definitions to setup graviton distribution_shops sequentially...");

        for (let i = 0; i < SQL_STMTS.length; i++) {
            console.log("Running statement " + (i + 1) + "/" + SQL_STMTS.length + "...");
            const { data, error } = await supabase.rpc('exec_sql', { query: SQL_STMTS[i] });

            if (error) {
                console.error("SQL Execution Error:", error);
                console.error("Statement:", SQL_STMTS[i]);
                process.exit(1);
            }
        }

        console.log("SQL execution completed successfully.");

        // Let's verify and show the table contents
        const { data: shops, error: shopsError } = await supabase
            .from('distribution_shops')
            .select('*');

        if (shopsError) console.error("Could not fetch shops:", shopsError);
        else console.log("Current Shops in Database:", shops);

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

runSQL();

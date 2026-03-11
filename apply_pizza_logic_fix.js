
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

const SQL = `CREATE OR REPLACE VIEW pizza1.v_pizza_orders AS
 WITH pizza_products AS (
         SELECT products.id AS product_id,
            products.name AS product_name
           FROM categories.products
          WHERE (((products.category_id IN ( SELECT categories.category_id
                   FROM categories.categories
                  WHERE (categories.category_name ~~* '%піца%'::text))) OR (products.name ~~* 'Піца%'::text)) AND (products.name !~~* '%30%см%'::text) AND (products.name !~~* '%коробка%'::text))
        ), shop_to_storage AS (
         SELECT s.spot_id,
            s.name AS spot_name,
            st.storage_id
           FROM (categories.spots s
             JOIN categories.storages st ON ((regexp_replace(lower(s.name), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text) = regexp_replace(replace(lower(st.storage_name), 'магазин'::text, ''::text), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text))))
          WHERE ((s.name !~~* '%test%'::text) AND (s.name !~~* '%тест%'::text))
        ), sales_dynamic AS (
         SELECT t.spot_id,
            ti.product_id,
            (sum(COALESCE(ti.num, (0)::numeric)) / 14.0) AS avg_dynamic
           FROM (categories.transactions t
             JOIN categories.transaction_items ti ON ((t.transaction_id = ti.transaction_id)))
          WHERE ((t.date_close >= CURRENT_DATE - INTERVAL '14 days') AND (t.date_close < CURRENT_DATE))
          GROUP BY t.spot_id, ti.product_id
        )
 SELECT m.spot_name AS "назва_магазину",
    p.product_name AS "назва_продукту",
    p.product_id AS "код_продукту",
    round(COALESCE(sj.avg_dynamic, (0)::numeric), 2) AS avg_sales_day,
    (ceil((COALESCE(sj.avg_dynamic, (0)::numeric) * 1.5)))::integer AS min_stock
   FROM ((shop_to_storage m
     CROSS JOIN pizza_products p)
     LEFT JOIN sales_dynamic sj ON (((m.spot_id = sj.spot_id) AND (p.product_id = sj.product_id))))`;

async function main() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: SQL })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`SQL Error: ${err}`);
        }

        console.log('Successfully updated pizza1.v_pizza_orders to dynamic 14-day average.');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();


const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        const query = `
CREATE OR REPLACE VIEW bakery1.mv_craft_daily_mart AS
 WITH all_keys AS (
         SELECT "хліб_переміщення_поставки"."дата" AS date,
            "хліб_переміщення_поставки"."магазин_id" AS store_id,
            "хліб_переміщення_поставки"."товар_id" AS sku_id
           FROM bakery1."хліб_переміщення_поставки"
          WHERE "хліб_переміщення_поставки"."дата" >= (CURRENT_DATE - 40)
        UNION
         SELECT "хліб_продажі_свіжі"."дата" AS date,
            "хліб_продажі_свіжі"."магазин_id" AS store_id,
            "хліб_продажі_свіжі"."товар_id" AS sku_id
           FROM bakery1."хліб_продажі_свіжі"
          WHERE "хліб_продажі_свіжі"."дата" >= (CURRENT_DATE - 40)
        UNION
         SELECT ("хліб_продажі_хліб30"."дата" - '1 day'::interval)::date AS date,
            "хліб_продажі_хліб30"."магазин_id" AS store_id,
            "хліб_продажі_хліб30"."товар_id" AS sku_id
           FROM bakery1."хліб_продажі_хліб30"
          WHERE "хліб_продажі_хліб30"."дата" >= (CURRENT_DATE - 40)
        ), fresh_sales AS (
         SELECT "хліб_продажі_свіжі"."дата" AS date,
            "хліб_продажі_свіжі"."магазин_id" AS store_id,
            "хліб_продажі_свіжі"."товар_id" AS sku_id,
            sum("хліб_продажі_свіжі"."кількість_шт") AS qty,
            sum("хліб_продажі_свіжі"."сума_грн") AS revenue
           FROM bakery1."хліб_продажі_свіжі"
          WHERE "хліб_продажі_свіжі"."дата" >= (CURRENT_DATE - 40)
          GROUP BY "хліб_продажі_свіжі"."дата", "хліб_продажі_свіжі"."магазин_id", "хліб_продажі_свіжі"."товар_id"
        ), disc_sales AS (
         SELECT ("хліб_продажі_хліб30"."дата" - '1 day'::interval)::date AS date,
            "хліб_продажі_хліб30"."магазин_id" AS store_id,
            "хліб_продажі_хліб30"."товар_id" AS sku_id,
            sum("хліб_продажі_хліб30"."кількість_шт") AS qty,
            sum("хліб_продажі_хліб30"."сума_грн") AS revenue
           FROM bakery1."хліб_продажі_хліб30"
          WHERE "хліб_продажі_хліб30"."дата" >= (CURRENT_DATE - 40)
          GROUP BY (("хліб_продажі_хліб30"."дата" - '1 day'::interval)::date), "хліб_продажі_хліб30"."магазин_id", "хліб_продажі_хліб30"."товар_id"
        ), actual_delivery AS (
         SELECT "хліб_переміщення_поставки"."дата" AS date,
            "хліб_переміщення_поставки"."магазин_id" AS store_id,
            "хліб_переміщення_поставки"."товар_id" AS sku_id,
            sum("хліб_переміщення_поставки"."кількість_шт") AS qty
           FROM bakery1."хліб_переміщення_поставки"
          WHERE "хліб_переміщення_поставки"."дата" >= (CURRENT_DATE - 40)
          GROUP BY "хліб_переміщення_поставки"."дата", "хліб_переміщення_поставки"."магазин_id", "хліб_переміщення_поставки"."товар_id"
        )
 SELECT k.date,
    k.store_id,
    s."магазин_назва" AS store_name,
    k.sku_id,
    p.name AS sku_name,
    COALESCE(d.qty, 0::numeric) AS qty_delivered,
    COALESCE(f.qty, 0::numeric) AS qty_fresh_sold,
    COALESCE(f.revenue, 0::numeric) AS revenue_fresh,
    COALESCE(ds.qty, 0::numeric) AS qty_disc_sold,
    COALESCE(ds.revenue, 0::numeric) AS revenue_disc,
    GREATEST(0::numeric, COALESCE(d.qty, 0::numeric) - COALESCE(f.qty, 0::numeric) - COALESCE(ds.qty, 0::numeric)) AS qty_waste
   FROM all_keys k
     JOIN bakery1."довідник_магазинів" s ON k.store_id = s."магазин_id"
     JOIN categories.products p ON k.sku_id = p.id
     LEFT JOIN actual_delivery d ON k.date = d.date AND k.store_id = d.store_id AND k.sku_id = d.sku_id
     LEFT JOIN fresh_sales f ON k.date = f.date AND k.store_id = f.store_id AND k.sku_id = f.sku_id
     LEFT JOIN disc_sales ds ON k.date = ds.date AND k.store_id = ds.store_id AND k.sku_id = ds.sku_id;
        `;
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query })
        });
        const data = await response.json();
        console.log("Creation Result:", JSON.stringify(data, null, 2));

        const queryTest = "SELECT count(*) FROM bakery1.mv_craft_daily_mart";
        const resTest = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryTest })
        });
        console.log("Count with 40 days:", JSON.stringify(await resTest.json(), null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

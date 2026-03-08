-- Script to create Konditerka views in the konditerka1 schema
-- Please execute this inside the Supabase SQL Editor.

CREATE SCHEMA IF NOT EXISTS konditerka1;

-- 1. Orders View
CREATE OR REPLACE VIEW konditerka1.v_konditerka_orders AS
WITH konditerka_products AS (
    SELECT p.id AS product_id,
           p.name AS product_name
    FROM categories.products p
    JOIN categories.categories c ON p.category_id = c.category_id
    WHERE c.category_name ILIKE '%кондите%' OR c.category_name ILIKE '%десерт%' OR c.category_name ILIKE '%солодк%' OR c.category_name ILIKE '%морозив%'
), shop_to_storage AS (
    SELECT s.spot_id,
           s.name AS spot_name,
           st.storage_id
    FROM categories.spots s
    JOIN categories.storages st ON regexp_replace(lower(s.name), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text) = regexp_replace(replace(lower(st.storage_name), 'магазин'::text, ''::text), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text)
    WHERE s.name NOT ILIKE '%test%'::text AND s.name NOT ILIKE '%тест%'::text
), sales_14_days AS (
    SELECT t.spot_id,
           ti.product_id,
           (sum(COALESCE(ti.num, (0)::numeric)) / 14.0) AS avg_14d
    FROM categories.transactions t
    JOIN categories.transaction_items ti ON t.transaction_id = ti.transaction_id
    WHERE t.date_close >= (CURRENT_DATE - INTERVAL '14 days') 
      AND t.date_close < CURRENT_DATE
    GROUP BY t.spot_id, ti.product_id
)
SELECT m.spot_name AS "назва_магазину",
       p.product_name AS "назва_продукту",
       p.product_id AS "код_продукту",
       round(COALESCE(s14.avg_14d, (0)::numeric), 2) AS avg_sales_day,
       (ceil((COALESCE(s14.avg_14d, (0)::numeric) * 1.5)))::integer AS min_stock
FROM shop_to_storage m
CROSS JOIN konditerka_products p
LEFT JOIN sales_14_days s14 ON m.spot_id = s14.spot_id AND p.product_id = s14.product_id;


-- 2. Production Only View
CREATE OR REPLACE VIEW konditerka1.v_konditerka_production_only AS
SELECT mi.product_id,
       mi.product_name,
       (sum(mi.quantity))::integer AS baked_at_factory,
       max(m.manufacture_date) AS last_update
FROM pizza1.manufacture_items mi
JOIN pizza1.manufactures m ON mi.manufacture_id = m.manufacture_id
-- We MUST filter by konditerka products here so we don't grab pizza production
JOIN categories.products p ON mi.product_id = p.id
JOIN categories.categories c ON p.category_id = c.category_id
WHERE m.storage_id = 15 AND m.manufacture_date >= CURRENT_DATE AND mi.is_deleted IS NOT TRUE
  AND (c.category_name ILIKE '%кондите%' OR c.category_name ILIKE '%десерт%' OR c.category_name ILIKE '%солодк%' OR c.category_name ILIKE '%морозив%')
GROUP BY mi.product_id, mi.product_name;


-- 3. Distribution Stats View
CREATE OR REPLACE VIEW konditerka1.v_konditerka_distribution_stats AS
SELECT vo."код_продукту" AS product_id,
       vo."назва_продукту" AS product_name,
       vo."назва_магазину" AS spot_name,
       vo.avg_sales_day,
       vo.min_stock,
       (COALESCE(max(ves.effective_stock), (0)::numeric))::integer AS stock_now,
       COALESCE(max(prod.baked_at_factory), 0) AS baked_at_factory,
       (GREATEST((0)::numeric, ((vo.min_stock)::numeric - COALESCE(max(ves.effective_stock), (0)::numeric))))::integer AS need_net
FROM konditerka1.v_konditerka_orders vo
LEFT JOIN konditerka1.v_konditerka_production_only prod ON vo."код_продукту" = prod.product_id
LEFT JOIN categories.spots s ON s.name = vo."назва_магазину"
LEFT JOIN categories.storages st ON regexp_replace(lower(s.name), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text) = regexp_replace(replace(lower(st.storage_name), 'магазин'::text, ''::text), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text)
LEFT JOIN pizza1.v_effective_stocks ves ON st.storage_id = ves.storage_id AND regexp_replace(lower(TRIM(BOTH FROM vo."назва_продукту")), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text) = regexp_replace(lower(TRIM(BOTH FROM ves.ingredient_name)), '[^а-яіїєґa-z0-9]'::text, ''::text, 'g'::text)
GROUP BY vo."код_продукту", vo."назва_продукту", vo."назва_магазину", vo.avg_sales_day, vo.min_stock;


-- 4. Summary Stats View
CREATE OR REPLACE VIEW konditerka1.v_konditerka_summary_stats AS
SELECT (( SELECT COALESCE(sum(konditerka1.v_konditerka_production_only.baked_at_factory), (0)::bigint) AS "coalesce"
           FROM konditerka1.v_konditerka_production_only))::integer AS total_baked,
       ((COALESCE(sum(konditerka1.v_konditerka_distribution_stats.min_stock), (0)::bigint) * 2))::integer AS total_norm,
       (COALESCE(sum(konditerka1.v_konditerka_distribution_stats.need_net), (0)::bigint))::integer AS total_need
FROM konditerka1.v_konditerka_distribution_stats;


-- 5. Production Plan Direct
CREATE OR REPLACE VIEW konditerka1.v_konditerka_production_plan_direct AS
WITH stats AS (
         SELECT v_konditerka_distribution_stats.product_name AS pizza_name,
            sum(v_konditerka_distribution_stats.avg_sales_day) AS daily_avg,
            sum(v_konditerka_distribution_stats.min_stock) AS target_1_5d,
            sum(v_konditerka_distribution_stats.stock_now) AS shop_stock,
            sum(v_konditerka_distribution_stats.need_net) AS total_need,
            count(*) FILTER (WHERE (v_konditerka_distribution_stats.stock_now <= 0)) AS zero_stock_shops_count,
            COALESCE(string_agg(v_konditerka_distribution_stats.spot_name, ', '::text) FILTER (WHERE (v_konditerka_distribution_stats.stock_now <= 0)), 'Все в наличии'::text) AS zero_stock_spots_list
           FROM konditerka1.v_konditerka_distribution_stats
          GROUP BY v_konditerka_distribution_stats.product_name
         HAVING (sum(v_konditerka_distribution_stats.avg_sales_day) > (0)::numeric)
        ), calculations AS (
         SELECT stats.pizza_name,
            stats.daily_avg,
            stats.target_1_5d,
            stats.shop_stock,
            stats.total_need,
            stats.zero_stock_shops_count,
            stats.zero_stock_spots_list,
                CASE
                    WHEN (stats.total_need <= 0) THEN (0)::numeric
                    ELSE (ceil(((stats.total_need)::numeric / 20.0)) * (20)::numeric)
                END AS production_order_20,
            round((((stats.total_need)::numeric / (NULLIF(stats.target_1_5d, 0))::numeric) * (100)::numeric), 1) AS priority_pct,
            round(((stats.daily_avg * ((stats.total_need)::numeric / (NULLIF(stats.target_1_5d, 0))::numeric)) * (100)::numeric), 0) AS risk_index
           FROM stats
        )
 SELECT calculations.pizza_name,
    round(calculations.daily_avg, 2) AS daily_avg,
    calculations.shop_stock,
    calculations.target_1_5d,
    calculations.total_need AS net_deficit,
    calculations.production_order_20,
    calculations.priority_pct,
    calculations.risk_index,
    calculations.zero_stock_shops_count,
    calculations.zero_stock_spots_list,
    0 AS sort_order
   FROM calculations
UNION ALL
 SELECT '--- ВСЬОГО ---'::text AS pizza_name,
    sum(calculations.daily_avg) AS daily_avg,
    sum(calculations.shop_stock) AS shop_stock,
    sum(calculations.target_1_5d) AS target_1_5d,
    sum(calculations.total_need) AS net_deficit,
    sum(calculations.production_order_20) AS production_order_20,
    NULL::numeric AS priority_pct,
    sum(calculations.risk_index) AS risk_index,
    sum(calculations.zero_stock_shops_count) AS zero_stock_shops_count,
    ''::text AS zero_stock_spots_list,
    1 AS sort_order
   FROM calculations
  ORDER BY 11, 8 DESC NULLS LAST, 2 DESC;

-- 6. GRANT PERMISSIONS
-- Required so that the API (anon, authenticated, service_role) can access the schema and views
GRANT USAGE ON SCHEMA konditerka1 TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA konditerka1 TO anon, authenticated, service_role;

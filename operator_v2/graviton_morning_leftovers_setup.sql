-- Створюємо View у схемі graviton, яке буде тягнути дані напряму з leftovers.daily_snapshots.
-- ФІЛЬТРУЄМО відразу ТІЛЬКИ по тих 7 складах магазинів, які прив'язані до Гравітону.

CREATE OR REPLACE VIEW graviton.v_morning_leftovers AS
SELECT 
    l.snapshot_date,
    l.storage_id,
    l.ingredient_id,
    l.ingredient_name,
    l.ingredient_left,
    l.storage_ingredient_left,
    l.limit_value,
    l.ingredient_unit,
    l.ingredients_type,
    l.storage_ingredient_sum,
    l.storage_ingredient_sum_netto,
    l.prime_cost,
    l.prime_cost_netto,
    l.hidden,
    l.loaded_at,
    l.api_response_raw
FROM leftovers.daily_snapshots l
INNER JOIN graviton.distribution_shops ds 
    ON l.storage_id = ds.storage_id
WHERE ds.is_active = true;

-- Оновлюємо distribution_base щоб він тягнув залишки тільки з цього нового View
CREATE OR REPLACE VIEW graviton.distribution_base AS
 WITH mapping AS (
         SELECT ds.spot_id,
            ds.storage_id,
            st.storage_name AS shop_name
           FROM (graviton.distribution_shops ds
             JOIN categories.storages st ON ((st.storage_id = ds.storage_id)))
          WHERE (ds.is_active = true)
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
         -- ВИКОРИСТОВУЄМО НОВЕ VIEW v_morning_leftovers
         SELECT ds.storage_id,
            ds.ingredient_name,
            sum(ds.storage_ingredient_left) AS current_stock
           FROM graviton.v_morning_leftovers ds
          WHERE (ds.snapshot_date = ( SELECT max(v_morning_leftovers.snapshot_date) AS max
                   FROM graviton.v_morning_leftovers))
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
  WHERE ((st.current_stock > (0)::numeric) OR (sl.avg_sales_day > (0)::numeric));


CREATE OR REPLACE VIEW graviton.distribution_base_test AS
 WITH mapping AS (
         SELECT ds.spot_id,
            ds.storage_id,
            st.storage_name AS shop_name
           FROM (graviton.distribution_shops ds
             JOIN categories.storages st ON ((st.storage_id = ds.storage_id)))
          WHERE (ds.is_active = true)
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
         -- ВИКОРИСТОВУЄМО НОВЕ VIEW v_morning_leftovers
         SELECT ds.storage_id,
            ds.ingredient_name,
            sum(ds.storage_ingredient_left) AS current_stock
           FROM graviton.v_morning_leftovers ds
          WHERE (ds.snapshot_date = ( SELECT max(v_morning_leftovers.snapshot_date) AS max
                   FROM graviton.v_morning_leftovers))
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
  WHERE ((st.current_stock > (0)::numeric) OR (sl.avg_sales_day > (0)::numeric));

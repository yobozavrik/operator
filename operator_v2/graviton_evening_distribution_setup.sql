-- ПОВЕРНЕННЯ ДО ІДЕАЛЬНОЇ ВЕЧІРНЬОЇ ЛОГІКИ (ВАРІАНТ 2)
-- Оскільки розподіл відбувається ввечері, ми беремо ЖИВІ залишки (stocks_now).
-- В живих залишках ВЖЕ відняті всі продажі та переміщення за день.
-- Тому ми просто віднімаємо від них СЬОГОДНІШНЄ ВИРОБНИЦТВО.

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
        ), today_production AS (
         -- РАХУЄМО ТІЛЬКИ СЬОГОДНІШНЄ ВИРОБНИЦТВО
         SELECT m.storage_id,
            TRIM(BOTH FROM mi.product_name) AS product_name,
            sum(mi.quantity) AS produced_today
           FROM (graviton.manufactures m
             JOIN graviton.manufacture_items mi ON ((mi.manufacture_id = m.manufacture_id)))
          WHERE ((date(m.manufacture_date) = CURRENT_DATE) AND (mi.is_deleted IS NOT TRUE))
          GROUP BY m.storage_id, TRIM(BOTH FROM mi.product_name)
        ), stock_data AS (
         -- БЕРЕМО ЖИВІ ЗАЛИШКИ І ВІДНІМАЄМО ВИРОБНИЦТВО
         SELECT s.storage_id,
            s.ingredient_name,
            -- stock_minus_production може бути від'ємним, і це ПРАВИЛЬНО для математики вечірнього розподілу!
            (s.storage_ingredient_left - COALESCE(tp.produced_today, (0)::numeric)) AS current_stock
           FROM (graviton.stocks_now s
             LEFT JOIN today_production tp ON (((tp.storage_id = s.storage_id) AND (lower(TRIM(BOTH FROM tp.product_name)) = lower(TRIM(BOTH FROM s.ingredient_name))))))
        )
 SELECT m.spot_id AS "код_магазину",
    m.shop_name AS "назва_магазину",
    cat.product_id AS "код_продукту",
    cat.product_name AS "назва_продукту",
    cat.category_name,
    COALESCE(st.current_stock, (0)::numeric) AS current_stock,
    COALESCE(sl.avg_sales_day, (0)::numeric) AS avg_sales_day,
    ceil((COALESCE(sl.avg_sales_day, (0)::numeric) * (3)::numeric)) AS min_stock,
    -- Якщо current_stock від'ємний (продали більше, ніж був ранковий залишок), deficit_kg буде більшим!
    ceil(GREATEST((0)::numeric, ((COALESCE(sl.avg_sales_day, (0)::numeric) * (3)::numeric) - COALESCE(st.current_stock, (0)::numeric)))) AS deficit_kg
   FROM (((mapping m
     CROSS JOIN catalog cat)
     LEFT JOIN stock_data st ON (((m.storage_id = st.storage_id) AND (lower(TRIM(BOTH FROM cat.product_name)) = lower(TRIM(BOTH FROM st.ingredient_name))))))
     LEFT JOIN sales_data sl ON (((m.spot_id = sl.spot_id) AND (cat.product_id = sl.product_id))))
  -- Прибираємо жорстку умову > 0 для current_stock, бо він може бути від'ємним, але товар все одно треба розподілити!
  WHERE ((st.current_stock IS NOT NULL) OR (sl.avg_sales_day > (0)::numeric));


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
        ), today_production AS (
         -- РАХУЄМО ТІЛЬКИ СЬОГОДНІШНЄ ВИРОБНИЦТВО
         SELECT m.storage_id,
            TRIM(BOTH FROM mi.product_name) AS product_name,
            sum(mi.quantity) AS produced_today
           FROM (graviton.manufactures m
             JOIN graviton.manufacture_items mi ON ((mi.manufacture_id = m.manufacture_id)))
          WHERE ((date(m.manufacture_date) = CURRENT_DATE) AND (mi.is_deleted IS NOT TRUE))
          GROUP BY m.storage_id, TRIM(BOTH FROM mi.product_name)
        ), stock_data AS (
         -- БЕРЕМО ЖИВІ ЗАЛИШКИ І ВІДНІМАЄМО ВИРОБНИЦТВО
         SELECT s.storage_id,
            s.ingredient_name,
            -- stock_minus_production може бути від'ємним, і це ПРАВИЛЬНО для математики вечірнього розподілу!
            (s.storage_ingredient_left - COALESCE(tp.produced_today, (0)::numeric)) AS current_stock
           FROM (graviton.stocks_now s
             LEFT JOIN today_production tp ON (((tp.storage_id = s.storage_id) AND (lower(TRIM(BOTH FROM tp.product_name)) = lower(TRIM(BOTH FROM s.ingredient_name))))))
        )
 SELECT m.spot_id AS "код_магазину",
    m.shop_name AS "назва_магазину",
    cat.product_id AS "код_продукту",
    cat.product_name AS "назва_продукту",
    cat.category_name,
    COALESCE(st.current_stock, (0)::numeric) AS current_stock,
    COALESCE(sl.avg_sales_day, (0)::numeric) AS avg_sales_day,
    ceil((COALESCE(sl.avg_sales_day, (0)::numeric) * (4)::numeric)) AS min_stock,
    -- Якщо current_stock від'ємний (продали більше, ніж був ранковий залишок), deficit_kg буде більшим!
    ceil(GREATEST((0)::numeric, ((COALESCE(sl.avg_sales_day, (0)::numeric) * (4)::numeric) - COALESCE(st.current_stock, (0)::numeric)))) AS deficit_kg
   FROM (((mapping m
     CROSS JOIN catalog cat)
     LEFT JOIN stock_data st ON (((m.storage_id = st.storage_id) AND (lower(TRIM(BOTH FROM cat.product_name)) = lower(TRIM(BOTH FROM st.ingredient_name))))))
     LEFT JOIN sales_data sl ON (((m.spot_id = sl.spot_id) AND (cat.product_id = sl.product_id))))
  -- Прибираємо жорстку умову > 0 для current_stock, бо він може бути від'ємним, але товар все одно треба розподілити!
  WHERE ((st.current_stock IS NOT NULL) OR (sl.avg_sales_day > (0)::numeric));

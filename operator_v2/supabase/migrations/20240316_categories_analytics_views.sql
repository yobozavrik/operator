-- supabase/migrations/20240316_categories_analytics_views.sql

-- 1. Сводная финансовая аналитика по датам, магазинам (точкам) и категориям
-- Связываем детализированные продажи (sold_products_detailed) с транзакциями (для даты и места),
-- точками продаж (spots) и категориями (categories).
CREATE OR REPLACE VIEW public.v_gb_finance_overview AS
SELECT
    DATE(t.date_start) AS transaction_date,
    s.name AS store_name,
    COALESCE(c.category_name, 'Без категорії') AS category,
    SUM(CASE WHEN spd.weight_flag = 1 THEN spd.num / 1000.0 ELSE spd.num END) AS total_quantity,
    SUM(spd.payed_sum) AS total_revenue,
    SUM(spd.product_profit) AS total_profit,
    CASE 
        WHEN SUM(spd.payed_sum) = 0 THEN 0 
        ELSE (SUM(spd.product_profit) / SUM(spd.payed_sum)) * 100 
    END AS margin_percent
FROM
    categories.sold_products_detailed spd
JOIN
    categories.transactions t ON spd.transaction_id = t.transaction_id
JOIN
    categories.spots s ON t.spot_id = s.spot_id
LEFT JOIN
    categories.categories c ON spd.category_id = c.id
WHERE 
    t.status <> 3
GROUP BY
    DATE(t.date_start),
    s.name,
    c.category_name;


-- 2. Общая финансовая сводка по бренду (только по датам, для графиков динамики)
CREATE OR REPLACE VIEW public.v_gb_finance_daily_brand AS
SELECT
    DATE(t.date_start) AS transaction_date,
    SUM(CASE WHEN spd.weight_flag = 1 THEN spd.num / 1000.0 ELSE spd.num END) AS total_quantity,
    SUM(spd.payed_sum) AS total_revenue,
    SUM(spd.product_profit) AS total_profit
FROM
    categories.sold_products_detailed spd
JOIN
    categories.transactions t ON spd.transaction_id = t.transaction_id
WHERE 
    t.status <> 3
GROUP BY
    DATE(t.date_start)
ORDER BY
    DATE(t.date_start) DESC;


-- 3. Топ продаваемых продуктов по категориям и магазинам (для таблицы лидеров продаж)
CREATE OR REPLACE VIEW public.v_gb_top_products_analytics AS
SELECT
    DATE(t.date_start) AS transaction_date,
    s.name AS store_name,
    COALESCE(c.category_name, 'Без категорії') AS category,
    spd.product_name,
    SUM(CASE WHEN spd.weight_flag = 1 THEN spd.num / 1000.0 ELSE spd.num END) AS quantity_sold,
    SUM(spd.payed_sum) AS revenue_generated,
    SUM(spd.product_profit) AS profit_generated
FROM
    categories.sold_products_detailed spd
JOIN
    categories.transactions t ON spd.transaction_id = t.transaction_id
JOIN
    categories.spots s ON t.spot_id = s.spot_id
LEFT JOIN
    categories.categories c ON spd.category_id::text = c.category_id
WHERE
    t.status <> 3
GROUP BY
    DATE(t.date_start),
    s.name,
    c.category_name,
    spd.product_name;

-- 4. Hourly Sales View (Нагрузка по часам)
CREATE OR REPLACE VIEW public.v_gb_hourly_load AS
SELECT
    hs.sales_date AS transaction_date,
    hs.hour_number,
    SUM(hs.revenue) AS total_revenue
FROM
    categories.hourly_sales hs
GROUP BY
    hs.sales_date,
    hs.hour_number
ORDER BY
    hs.sales_date DESC, hs.hour_number ASC;

-- 20260228_finance_kpi_view.sql
-- Создание витрины для KPI (Revenue, Checks, Profit, Tips, Discounts) по дням и магазинам

CREATE OR REPLACE VIEW public.v_gb_finance_kpi_daily AS
SELECT
    DATE(t.date_start) AS transaction_date,
    s.name AS store_name,
    COUNT(t.transaction_id) AS total_checks,
    SUM(t.payed_sum) AS total_revenue,
    SUM(t.total_profit_netto) AS total_profit,
    SUM(t.discount) AS total_discount,
    SUM(t.tip_sum) AS total_tips,
    SUM(t.guests_count) AS total_guests
FROM
    categories.transactions t
JOIN
    categories.spots s ON t.spot_id = s.spot_id
WHERE
    t.status <> 3 -- Исключаем отмененные транзакции
GROUP BY
    DATE(t.date_start),
    s.name;

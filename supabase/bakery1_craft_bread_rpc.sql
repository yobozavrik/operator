CREATE OR REPLACE FUNCTION bakery1.f_get_craft_bread_analytics(
    p_start_date DATE,
    p_end_date DATE,
    p_store_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    sku_name TEXT,
    total_fresh NUMERIC,
    total_disc NUMERIC,
    total_writeoff NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        sku_name,
        SUM(fresh_qty) AS total_fresh,
        SUM(disc_qty) AS total_disc,
        SUM(writeoff_qty) AS total_writeoff
    FROM bakery1.v_craft_bread_daily
    WHERE sales_date >= p_start_date 
      AND sales_date <= p_end_date
      AND (p_store_id IS NULL OR store_id = p_store_id)
    GROUP BY sku_name
    ORDER BY total_fresh DESC NULLS LAST;
$$;

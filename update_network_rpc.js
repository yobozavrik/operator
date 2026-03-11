
const SQL = `
CREATE OR REPLACE FUNCTION bakery1.f_craft_get_network_metrics(p_start_date date, p_end_date date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    v_days_diff INTEGER;
    v_prev_start_date DATE;
    v_prev_end_date DATE;
BEGIN
    v_days_diff := p_end_date - p_start_date;
    v_prev_start_date := p_start_date - (v_days_diff + 1);
    v_prev_end_date := p_end_date - (v_days_diff + 1);

    WITH base_metrics AS (
        SELECT 
            SUM(qty_delivered) as qty_delivered,
            SUM(qty_fresh_sold) as qty_fresh_sold,
            SUM(qty_disc_sold) as qty_disc_sold,
            SUM(qty_waste) as qty_waste,
            SUM(revenue_fresh) as revenue_fresh,
            SUM(revenue_disc) as revenue_disc,
            -- Розраховуємо списання в грошах (використовуючи середню ціну фрешу на точку/тoвар)
            SUM(qty_waste * (revenue_fresh / NULLIF(qty_fresh_sold, 0))) as waste_uah,
            -- Оцінка втраченої виручки (якщо все продано і списань 0)
            SUM(CASE WHEN qty_delivered > 0 AND qty_waste = 0 AND qty_disc_sold = 0 AND qty_fresh_sold = qty_delivered 
                     THEN revenue_fresh * 0.15 ELSE 0 END) as lost_revenue
        FROM bakery1.mv_craft_daily_mart
        WHERE date >= p_start_date AND date <= p_end_date
    )
    SELECT json_build_object(
        'qty_delivered', qty_delivered,
        'qty_fresh_sold', qty_fresh_sold,
        'qty_disc_sold', qty_disc_sold,
        'qty_waste', qty_waste,
        'revenue_fresh', revenue_fresh,
        'revenue_disc', revenue_disc,
        'waste_uah', ROUND(COALESCE(waste_uah, 0), 0),
        'lost_revenue', ROUND(COALESCE(lost_revenue, 0), 0),
        'waste_rate', CASE WHEN qty_delivered > 0 THEN ROUND(qty_waste::NUMERIC / qty_delivered * 100, 2) ELSE 0 END,
        'sell_through_rate', CASE WHEN qty_delivered > 0 THEN ROUND((qty_fresh_sold + qty_disc_sold)::NUMERIC / qty_delivered * 100, 2) ELSE 0 END,
        
        'trend_current', (
            SELECT COALESCE(json_agg(row_to_json(curr)), '[]'::JSON)
            FROM (
                SELECT 
                    date, 
                    SUM(qty_fresh_sold + qty_disc_sold) as total_sold,
                    SUM(qty_waste) as total_waste,
                    SUM(qty_delivered) as total_delivered
                FROM bakery1.mv_craft_daily_mart
                WHERE date >= p_start_date AND date <= p_end_date
                GROUP BY date ORDER BY date ASC
            ) curr
        ),
        
        'trend_previous', (
            SELECT COALESCE(json_agg(row_to_json(prev)), '[]'::JSON)
            FROM (
                SELECT 
                    date, 
                    SUM(qty_fresh_sold + qty_disc_sold) as total_sold,
                    SUM(qty_waste) as total_waste,
                    SUM(qty_delivered) as total_delivered
                FROM bakery1.mv_craft_daily_mart
                WHERE date >= v_prev_start_date AND date <= v_prev_end_date
                GROUP BY date ORDER BY date ASC
            ) prev
        )
    ) INTO result
    FROM base_metrics;
    
    RETURN COALESCE(result, '{}'::JSON);
END;
$function$;
`;

console.log("SQL to execute manually in Supabase Dashboard:");
console.log(SQL);

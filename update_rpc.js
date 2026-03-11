import { createClient } from '@supabase/supabase-js';

async function executeSql() {
    const query = `
CREATE OR REPLACE FUNCTION bakery1.f_craft_get_store_ranking(p_start_date DATE, p_end_date DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'top_stores', (
            SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON)
            FROM (
                SELECT 
                    store_id, 
                    store_name, 
                    SUM(qty_fresh_sold + qty_disc_sold) as total_sold, 
                    SUM(qty_fresh_sold) as fresh_sold,
                    SUM(qty_disc_sold) as disc_sold,
                    SUM(qty_waste) as total_waste,
                    SUM(revenue_fresh) as revenue_fresh,
                    SUM(revenue_disc) as revenue_disc,
                    SUM(revenue_waste) as waste_uah,
                    CASE WHEN SUM(qty_fresh_sold + qty_disc_sold) > 0 THEN 
                        ROUND((SUM(qty_disc_sold)::numeric / SUM(qty_fresh_sold + qty_disc_sold)) * 100, 2)
                    ELSE 0 END as cannibalization_pct
                FROM bakery1.mv_craft_daily_mart
                WHERE date >= p_start_date AND date <= p_end_date
                GROUP BY 1, 2
                ORDER BY total_sold DESC
                LIMIT 5
            ) t
        ),
        'bottom_stores', (
            SELECT COALESCE(json_agg(row_to_json(b)), '[]'::JSON)
            FROM (
                SELECT 
                    store_id, 
                    store_name, 
                    SUM(qty_fresh_sold + qty_disc_sold) as total_sold, 
                    SUM(qty_fresh_sold) as fresh_sold,
                    SUM(qty_disc_sold) as disc_sold,
                    SUM(qty_waste) as total_waste,
                    SUM(revenue_fresh) as revenue_fresh,
                    SUM(revenue_disc) as revenue_disc,
                    SUM(revenue_waste) as waste_uah,
                    CASE WHEN SUM(qty_fresh_sold + qty_disc_sold) > 0 THEN 
                        ROUND((SUM(qty_disc_sold)::numeric / SUM(qty_fresh_sold + qty_disc_sold)) * 100, 2)
                    ELSE 0 END as cannibalization_pct
                FROM bakery1.mv_craft_daily_mart
                WHERE date >= p_start_date AND date <= p_end_date
                GROUP BY 1, 2
                ORDER BY total_sold ASC
                LIMIT 5
            ) b
        ),
        'all_stores', (
            SELECT COALESCE(json_agg(row_to_json(all_s)), '[]'::JSON)
            FROM (
                SELECT 
                    store_id, 
                    store_name, 
                    SUM(qty_fresh_sold + qty_disc_sold) as total_sold, 
                    SUM(qty_fresh_sold) as fresh_sold,
                    SUM(qty_disc_sold) as disc_sold,
                    SUM(qty_waste) as total_waste,
                    SUM(revenue_fresh) as revenue_fresh,
                    SUM(revenue_disc) as revenue_disc,
                    SUM(revenue_waste) as waste_uah,
                    CASE WHEN SUM(qty_fresh_sold + qty_disc_sold) > 0 THEN 
                        ROUND((SUM(qty_disc_sold)::numeric / SUM(qty_fresh_sold + qty_disc_sold)) * 100, 2)
                    ELSE 0 END as cannibalization_pct
                FROM bakery1.mv_craft_daily_mart
                WHERE date >= p_start_date AND date <= p_end_date
                GROUP BY 1, 2
                ORDER BY total_sold DESC
            ) all_s
        ),
        'sku_abc', (
            SELECT COALESCE(json_agg(row_to_json(s)), '[]'::JSON)
            FROM (
                SELECT 
                    sku_id, 
                    sku_name, 
                    SUM(qty_fresh_sold + qty_disc_sold) as total_sold, 
                    SUM(revenue_fresh + revenue_disc) as total_revenue,
                    SUM(revenue_waste) as waste_uah
                FROM bakery1.mv_craft_daily_mart
                WHERE date >= p_start_date AND date <= p_end_date
                GROUP BY 1, 2
                ORDER BY total_revenue DESC
            ) s
        )
    ) INTO result;
    RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
    `;

    const res = await fetch("https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/exec_sql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ",
            "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ"
        },
        body: JSON.stringify({ query: query.trim() })
    });

    const json = await res.json();
    console.log("Result:", json);
}

executeSql();

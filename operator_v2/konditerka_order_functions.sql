-- konditerka1 Order Functions

CREATE OR REPLACE FUNCTION public.f_generate_production_plan_konditerka(p_days integer)
 RETURNS TABLE(plan_day integer, product_name text, quantity integer, predicted_risk numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    d int; r record; counter int; current_qty int;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS virtual_stock_konditerka (
        p_name text PRIMARY KEY, v_stock numeric, v_daily_avg numeric, v_target numeric
    ) ON COMMIT DROP;

    TRUNCATE virtual_stock_konditerka;

    INSERT INTO virtual_stock_konditerka (p_name, v_stock, v_daily_avg, v_target)
    SELECT stats.product_name, SUM(stats.stock_now), SUM(stats.avg_sales_day), SUM(stats.min_stock)
    FROM konditerka1.v_konditerka_distribution_stats stats
    WHERE stats.avg_sales_day > 0 
    GROUP BY stats.product_name;

    FOR d IN 1..p_days LOOP
        counter := 1;
        FOR r IN (
            SELECT p_name, v_daily_avg, v_stock, v_target,
            ROUND((v_daily_avg * (GREATEST(0, v_target - v_stock) / NULLIF(v_target, 0)) * 100) 
                + (CASE WHEN v_stock <= 0 THEN 10000 ELSE 0 END), 0) as risk
            FROM virtual_stock_konditerka 
            ORDER BY risk DESC, v_daily_avg DESC 
            LIMIT 10 -- Generates 10 items per day for Konditerka
        ) LOOP
            -- Defaulting order amounts for items to 20 for Konditerka
            current_qty := 20;
            plan_day := d; product_name := r.p_name; quantity := current_qty; predicted_risk := r.risk;
            RETURN NEXT;
            UPDATE virtual_stock_konditerka SET v_stock = v_stock + current_qty WHERE p_name = r.p_name AND 1=1;
            counter := counter + 1;
        END LOOP;
        
        -- End of day decay
        UPDATE virtual_stock_konditerka SET v_stock = GREATEST(0, v_stock - v_daily_avg) WHERE 1=1;
    END LOOP;
END;
$$;


CREATE OR REPLACE FUNCTION public.f_generate_order_plan_konditerka(p_days integer)
 RETURNS TABLE(p_day integer, p_name text, p_avg numeric, p_stock numeric, p_min numeric, p_order numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        plan.plan_day,
        plan.product_name::text,
        COALESCE(s.avg_sales_day, 0)::numeric,
        COALESCE(s.stock_now, 0)::numeric, 
        COALESCE(s.min_stock, 0)::numeric,
        plan.quantity::numeric
    FROM public.f_generate_production_plan_konditerka(p_days) AS plan
    LEFT JOIN (
        SELECT 
            stats.product_name, 
            SUM(stats.avg_sales_day) AS avg_sales_day, 
            SUM(stats.stock_now) AS stock_now, 
            SUM(stats.min_stock) AS min_stock
        FROM konditerka1.v_konditerka_distribution_stats stats
        GROUP BY stats.product_name
    ) s ON plan.product_name = s.product_name
    ORDER BY plan.plan_day ASC, plan.quantity DESC;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.f_generate_production_plan_konditerka(integer) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.f_generate_order_plan_konditerka(integer) TO authenticated, anon, service_role;

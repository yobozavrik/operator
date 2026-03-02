-- =====================================================================
-- PATCH: Limit Graviton Distribution to 3x Min Stock
-- =====================================================================
-- This patch updates the distribution functions to stop pushing 
-- surplus inventory to shops once their stock reaches 3x the minimum 
-- required stock (min_stock). Any remaining produced quantities 
-- are explicitly inserted as 'Остаток на Складе' (Stock on hand) 
-- for the Graviton production facility.

-- 1. Patch the v2 function (used by manual dashboard distribution)
CREATE OR REPLACE FUNCTION graviton.fn_run_distribution_v2(
    p_product_id integer, 
    p_batch_id uuid, 
    p_business_date date, 
    p_shop_ids integer[] DEFAULT NULL::integer[]
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET statement_timeout TO '300s'
AS $function$
DECLARE
    v_pool INT;
    v_product_name TEXT;
    v_zeros_count INT;
    v_total_need INT;
    v_remainder INT;
    v_multiplier INT := 2;
    v_k NUMERIC;
BEGIN
    -- [A] Динамический выбор магазинов если NULL
    IF p_shop_ids IS NULL THEN
        SELECT array_agg(DISTINCT "код_магазину")
        INTO p_shop_ids
        FROM graviton.distribution_base
        WHERE "код_продукту" = p_product_id;
    END IF;

    -- [B] Чистка ТОЛЬКО temp таблицы (БЕЗ DELETE из results!)
    DROP TABLE IF EXISTS temp_calc_g;

    -- [C] Ресурс (Выпечка)
    SELECT baked_qty, product_name 
    INTO v_pool, v_product_name
    FROM graviton.v_production_logic
    WHERE product_id = p_product_id 
    LIMIT 1;

    IF v_pool IS NULL OR v_pool <= 0 THEN RETURN; END IF;

    -- [D] Загрузка данных с динамическим массивом магазинов
    CREATE TEMP TABLE temp_calc_g AS
    SELECT 
        "назва_магазину" as spot_name,
        COALESCE("avg_sales_day", 0) as avg_sales_day,
        COALESCE("min_stock", 0) as min_stock,
        "current_stock" as effective_stock, -- ДОЗВОЛЯЄМО МІНУСОВІ ЗНАЧЕННЯ!
        0 as final_qty,
        0 as temp_need
    FROM graviton.distribution_base
    WHERE "код_продукту" = p_product_id
      AND "код_магазину" = ANY(p_shop_ids);

    -- [E] ЭТАП 1: НУЛИ (Выдача по 1 шт тем, у кого <= 0)
    SELECT COUNT(*) INTO v_zeros_count FROM temp_calc_g WHERE effective_stock <= 0;

    IF v_pool <= v_zeros_count THEN
        UPDATE temp_calc_g SET final_qty = 1 
        WHERE spot_name IN (
            SELECT spot_name FROM temp_calc_g 
            WHERE effective_stock <= 0 
            ORDER BY avg_sales_day DESC, spot_name ASC 
            LIMIT v_pool
        );
        v_pool := 0;
    ELSE
        UPDATE temp_calc_g SET final_qty = 1 WHERE effective_stock <= 0;
        v_pool := v_pool - v_zeros_count;
    END IF;

    -- [F] ЭТАП 2: МИНИМУМЫ (Доводим до min_stock)
    IF v_pool > 0 THEN
        UPDATE temp_calc_g SET temp_need = GREATEST(0, min_stock - (effective_stock + final_qty)) WHERE true;
        SELECT SUM(temp_need) INTO v_total_need FROM temp_calc_g;

        IF v_total_need > 0 THEN
            IF v_pool < v_total_need THEN
                v_k := v_pool::numeric / v_total_need::numeric;
                UPDATE temp_calc_g SET final_qty = final_qty + FLOOR(temp_need * v_k) WHERE true;
                
                SELECT (v_pool - SUM(FLOOR(temp_need * v_k)))::int INTO v_remainder FROM temp_calc_g;
                IF v_remainder > 0 THEN
                    UPDATE temp_calc_g SET final_qty = final_qty + 1 
                    WHERE spot_name IN (SELECT spot_name FROM temp_calc_g ORDER BY avg_sales_day DESC LIMIT v_remainder);
                END IF;
                v_pool := 0;
            ELSE
                UPDATE temp_calc_g SET final_qty = final_qty + temp_need WHERE true;
                v_pool := v_pool - v_total_need;
            END IF;
        END IF;
    END IF;

    -- [G] ЭТАП 3: ИЗЛИШКИ (Доводим до 3x min_stock максимум)
    WHILE v_pool > 0 LOOP
        UPDATE temp_calc_g SET temp_need = GREATEST(0, (min_stock * v_multiplier) - (effective_stock + final_qty)) WHERE true;
        SELECT SUM(temp_need) INTO v_total_need FROM temp_calc_g;

        -- CHANGED FROM 15 TO 3 TO CAP THE DISTRIBUTION AT 3X MIN_STOCK
        EXIT WHEN v_total_need = 0 OR v_multiplier > 3; 

        IF v_pool < v_total_need THEN
            v_k := v_pool::numeric / v_total_need::numeric;
            UPDATE temp_calc_g SET final_qty = final_qty + FLOOR(temp_need * v_k) WHERE true;
            
            SELECT (v_pool - SUM(FLOOR(temp_need * v_k)))::int INTO v_remainder FROM temp_calc_g;
            IF v_remainder > 0 THEN
                UPDATE temp_calc_g SET final_qty = final_qty + 1 
                WHERE spot_name IN (SELECT spot_name FROM temp_calc_g ORDER BY avg_sales_day DESC LIMIT v_remainder);
            END IF;
            v_pool := 0;
        ELSE
            UPDATE temp_calc_g SET final_qty = final_qty + temp_need WHERE true;
            v_pool := v_pool - v_total_need;
            v_multiplier := v_multiplier + 1;
        END IF;
    END LOOP;

    -- [H] ЗАПИСЬ РЕЗУЛЬТАТОВ (Для точек)
    INSERT INTO graviton.distribution_results (
        product_id, product_name, spot_name, quantity_to_ship, 
        calculation_batch_id, business_date, delivery_status
    )
    SELECT 
        p_product_id, v_product_name, spot_name, final_qty, 
        p_batch_id, p_business_date, 'pending' 
    FROM temp_calc_g 
    WHERE final_qty > 0;

    -- [I] Остаток на складе (Всё что осталось свыше 3х нормативов)
    IF v_pool > 0 THEN
         INSERT INTO graviton.distribution_results (
            product_id, product_name, spot_name, quantity_to_ship, 
            calculation_batch_id, business_date, delivery_status
        )
        VALUES (
            p_product_id, v_product_name, 'Остаток на Складе', v_pool, 
            p_batch_id, p_business_date, 'delivered'
        );
    END IF;

END;
$function$;

-- 2. Patch the BIGINT generic function (used by automatic hooks)
CREATE OR REPLACE FUNCTION graviton.fn_run_distribution(
    p_product_id bigint, 
    p_batch_id uuid, 
    p_business_date date
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_pool INT; 
    v_product_name TEXT;
    v_zeros_count INT;
    v_total_need INT;
    v_remainder INT;
    v_multiplier INT := 2;
    v_k NUMERIC;
BEGIN
    -- 1. Очистка
    DELETE FROM graviton.distribution_results 
    WHERE product_id = p_product_id AND business_date = p_business_date;

    -- 2. Ресурс
    SELECT FLOOR(baked_qty)::int, product_name 
    INTO v_pool, v_product_name
    FROM graviton.v_production_logic
    WHERE product_id = p_product_id LIMIT 1;

    IF v_pool IS NULL OR v_pool <= 0 THEN RETURN; END IF;

    -- 3. Тимчасова таблиця розрахунку (БЕЗ ВІРТУАЛУ)
    DROP TABLE IF EXISTS temp_calc_g;
    CREATE TEMP TABLE temp_calc_g AS
    SELECT 
        "назва_магазину" as spot_name,
        COALESCE("avg_sales_day", 0)::numeric as avg_sales_day,
        "min_stock"::int as min_stock,
        "current_stock"::int as current_stock, -- ДОЗВОЛЯЄМО МІНУСОВІ ЗНАЧЕННЯ!
        0 as final_qty,
        0 as temp_need
    FROM graviton.distribution_base
    WHERE "код_продукту" = p_product_id;

    -- ФАЗА 1: НУЛІ (Видача по 1 шт тем, у кого <= 0)
    SELECT COUNT(*) INTO v_zeros_count FROM temp_calc_g WHERE current_stock <= 0;
    IF v_zeros_count > 0 THEN
        IF v_pool <= v_zeros_count THEN
            UPDATE temp_calc_g SET final_qty = 1 
            WHERE spot_name IN (SELECT spot_name FROM temp_calc_g WHERE current_stock <= 0 ORDER BY avg_sales_day DESC LIMIT v_pool);
            v_pool := 0;
        ELSE
            UPDATE temp_calc_g SET final_qty = 1 WHERE current_stock <= 0;
            v_pool := v_pool - v_zeros_count;
        END IF;
    END IF;

    -- ФАЗА 2: МІНІМУМИ
    IF v_pool > 0 THEN
        UPDATE temp_calc_g SET temp_need = GREATEST(0, min_stock - (current_stock + final_qty));
        SELECT SUM(temp_need) INTO v_total_need FROM temp_calc_g;
        IF v_total_need > 0 THEN
            IF v_pool < v_total_need THEN
                v_k := v_pool::numeric / v_total_need::numeric;
                UPDATE temp_calc_g SET final_qty = final_qty + FLOOR(temp_need * v_k);
                SELECT (v_pool - SUM(FLOOR(temp_need * v_k))) INTO v_remainder FROM temp_calc_g;
                IF v_remainder > 0 THEN
                    UPDATE temp_calc_g SET final_qty = final_qty + 1 
                    WHERE spot_name IN (SELECT spot_name FROM temp_calc_g WHERE temp_need > 0 ORDER BY avg_sales_day DESC LIMIT v_remainder);
                END IF;
                v_pool := 0;
            ELSE
                UPDATE temp_calc_g SET final_qty = final_qty + temp_need;
                v_pool := v_pool - v_total_need;
            END IF;
        END IF;
    END IF;

    -- ФАЗА 3: НАДЛИШКИ (Доводим до 3x min_stock максимум)
    WHILE v_pool > 0 AND v_multiplier <= 3 LOOP -- ЗМІНЕНО З 15 НА 3
        UPDATE temp_calc_g SET temp_need = GREATEST(0, (min_stock * v_multiplier) - (current_stock + final_qty));
        SELECT SUM(temp_need) INTO v_total_need FROM temp_calc_g;
        EXIT WHEN v_total_need <= 0; 
        IF v_pool < v_total_need THEN
            v_k := v_pool::numeric / v_total_need::numeric;
            UPDATE temp_calc_g SET final_qty = final_qty + FLOOR(temp_need * v_k);
            SELECT (v_pool - SUM(FLOOR(temp_need * v_k))) INTO v_remainder FROM temp_calc_g;
            IF v_remainder > 0 THEN
                UPDATE temp_calc_g SET final_qty = final_qty + 1 
                WHERE spot_name IN (SELECT spot_name FROM temp_calc_g WHERE temp_need > 0 ORDER BY avg_sales_day DESC LIMIT v_remainder);
            END IF;
            v_pool := 0;
        ELSE
            UPDATE temp_calc_g SET final_qty = final_qty + temp_need;
            v_pool := v_pool - v_total_need;
            v_multiplier := v_multiplier + 1;
        END IF;
    END LOOP;

    -- Запис результатів
    INSERT INTO graviton.distribution_results (product_id, product_name, spot_name, quantity_to_ship, calculation_batch_id, business_date, delivery_status)
    SELECT p_product_id, v_product_name, spot_name, final_qty, p_batch_id, p_business_date, 'pending'
    FROM temp_calc_g WHERE final_qty > 0;

    -- Фіксація залишку на складі виробництва
    IF v_pool > 0 THEN
         INSERT INTO graviton.distribution_results (product_id, product_name, spot_name, quantity_to_ship, calculation_batch_id, business_date, delivery_status)
         VALUES (p_product_id, v_product_name, 'Остаток на Складе', v_pool, p_batch_id, p_business_date, 'delivered');
    END IF;
END;
$function$;

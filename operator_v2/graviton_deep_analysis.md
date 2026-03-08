# Deep Analysis of Graviton Database Schema

## Tables
### manufacture_items
| Column | Type | Default | Nullable |
|---|---|---|---|
| id | bigint | nextval('graviton.manufacture_items_id_seq'::regclass) | NO |
| manufacture_id | integer |  | YES |
| product_id | integer |  | YES |
| ingredient_id | integer |  | YES |
| product_name | text |  | YES |
| quantity | numeric |  | YES |
| type | integer |  | YES |
| is_deleted | boolean |  | YES |

### manufactures
| Column | Type | Default | Nullable |
|---|---|---|---|
| manufacture_id | integer |  | NO |
| storage_id | integer |  | YES |
| user_id | integer |  | YES |
| manufacture_date | timestamp without time zone |  | YES |
| total_sum | numeric |  | YES |

### daily_snapshots
| Column | Type | Default | Nullable |
|---|---|---|---|
| snapshot_date | date |  | NO |
| storage_id | integer |  | NO |
| ingredient_id | integer |  | NO |
| ingredient_name | text |  | YES |
| storage_ingredient_left | numeric |  | YES |
| ingredient_unit | text |  | YES |
| created_at | timestamp without time zone | now() | YES |

### production_catalog
| Column | Type | Default | Nullable |
|---|---|---|---|
| id | bigint | nextval('graviton.production_catalog_id_seq'::regclass) | NO |
| product_id | bigint |  | NO |
| category_id | text |  | NO |
| category_name | text |  | NO |
| product_name | text |  | NO |
| portion_size | numeric |  | NO |
| unit | text | 'кг'::text | NO |
| is_active | boolean | true | NO |
| created_at | timestamp with time zone | now() | NO |
| updated_at | timestamp with time zone | now() | NO |

### distribution_logs
| Column | Type | Default | Nullable |
|---|---|---|---|
| id | uuid | gen_random_uuid() | NO |
| batch_id | uuid |  | YES |
| business_date | date |  | YES |
| started_at | timestamp with time zone | now() | YES |
| completed_at | timestamp with time zone |  | YES |
| status | text |  | YES |
| triggered_by | uuid |  | YES |
| error_message | text |  | YES |
| products_count | integer |  | YES |
| total_kg | numeric |  | YES |
| shop_ids_selected | ARRAY |  | YES |

### distribution_results
| Column | Type | Default | Nullable |
|---|---|---|---|
| id | uuid | gen_random_uuid() | NO |
| product_id | bigint |  | YES |
| product_name | text |  | YES |
| spot_name | text |  | YES |
| quantity_to_ship | integer |  | YES |
| calculation_batch_id | uuid |  | YES |
| business_date | date |  | YES |
| created_at | timestamp with time zone | now() | YES |
| delivery_status | text | 'pending'::text | YES |

### stocks_now
| Column | Type | Default | Nullable |
|---|---|---|---|
| storage_id | integer |  | NO |
| ingredient_id | integer |  | NO |
| ingredient_name | text |  | NO |
| storage_ingredient_left | numeric | 0 | NO |
| ingredient_unit | text |  | YES |
| updated_at | timestamp with time zone | now() | YES |

### order_log
| Column | Type | Default | Nullable |
|---|---|---|---|
| log_id | bigint | nextval('graviton.order_log_log_id_seq'::regclass) | NO |
| order_date | date |  | NO |
| order_type | text |  | NO |
| order_data | jsonb |  | NO |
| total_kg | numeric |  | NO |
| sku_count | integer |  | NO |
| sent_to_telegram | boolean | false | YES |
| telegram_message_id | text |  | YES |
| created_at | timestamp with time zone | now() | YES |
| created_by | text |  | YES |

## Views and Formulas
### v_graviton_production_tasks
```sql
 SELECT v_production_tasks.product_id,
    v_production_tasks.product_name,
    v_production_tasks.business_date,
    v_production_tasks.category_id,
    v_production_tasks.category_name,
    v_production_tasks.total_demand_kg,
    v_production_tasks.portion_weight_kg,
    v_production_tasks.unit,
    v_production_tasks.portions_needed,
    v_production_tasks.actual_production_kg,
    v_production_tasks.in_production_catalog
   FROM graviton.v_production_tasks;
```

### v_graviton_results_public
```sql
 SELECT distribution_results.id,
    distribution_results.product_name AS "Название продукта",
    distribution_results.spot_name AS "Магазин",
    distribution_results.quantity_to_ship AS "Количество",
    distribution_results.created_at AS "Время расчета"
   FROM graviton.distribution_results
  WHERE ((distribution_results.created_at)::date = CURRENT_DATE)
  ORDER BY distribution_results.product_name, distribution_results.spot_name;
```

### v_graviton_plan_d1_detailed
```sql
 SELECT gs.product_name,
    COALESCE(c.category_name, 'Без категорії'::text) AS category_name,
    gs.spot_name AS store_name,
    gs.effective_stock AS current_stock,
    gs.min_stock,
    gs.avg_sales_day,
    GREATEST((0)::numeric, (gs.min_stock - gs.effective_stock)) AS deficit_kg,
    (gs.avg_sales_day * (1)::numeric) AS recommended_kg,
        CASE
            WHEN (gs.effective_stock <= (0)::numeric) THEN 1
            WHEN (gs.effective_stock < gs.min_stock) THEN 2
            ELSE 3
        END AS priority_number,
        CASE
            WHEN (gs.effective_stock <= (0)::numeric) THEN 'critical'::text
            WHEN (gs.effective_stock < gs.min_stock) THEN 'high'::text
            ELSE 'reserve'::text
        END AS priority
   FROM ((graviton.v_graviton_stats_with_effective_stock gs
     LEFT JOIN categories.products p ON ((p.name = gs.product_name)))
     LEFT JOIN categories.categories c ON ((c.category_id = p.category_id)))
  WHERE (gs.effective_stock < gs.min_stock)
  ORDER BY
        CASE
            WHEN (gs.effective_stock <= (0)::numeric) THEN 1
            WHEN (gs.effective_stock < gs.min_stock) THEN 2
            ELSE 3
        END, gs.product_name, gs.spot_name;
```

### v_graviton_plan_d1
```sql
 WITH base_stats AS (
         SELECT v_graviton_stats_with_effective_stock.product_id,
            v_graviton_stats_with_effective_stock.product_name,
            v_graviton_stats_with_effective_stock.category_name,
            sum(v_graviton_stats_with_effective_stock.avg_sales_day) AS daily_avg_network,
            sum(v_graviton_stats_with_effective_stock.effective_stock) AS effective_stock_d0,
            sum(GREATEST((0)::numeric, (v_graviton_stats_with_effective_stock.min_stock - v_graviton_stats_with_effective_stock.effective_stock))) AS deficit_d0,
            count(*) FILTER (WHERE (v_graviton_stats_with_effective_stock.effective_stock <= (0)::numeric)) AS zero_shops,
            sum(v_graviton_stats_with_effective_stock.min_stock) AS norm_network
           FROM graviton.v_graviton_stats_with_effective_stock
          GROUP BY v_graviton_stats_with_effective_stock.product_id, v_graviton_stats_with_effective_stock.product_name, v_graviton_stats_with_effective_stock.category_name
        ), with_need AS (
         SELECT base_stats.product_id,
            base_stats.product_name,
            base_stats.category_name,
            base_stats.daily_avg_network,
            base_stats.effective_stock_d0,
            base_stats.deficit_d0,
            base_stats.zero_shops,
            base_stats.norm_network,
            (base_stats.deficit_d0 + base_stats.daily_avg_network) AS raw_need,
            ((base_stats.daily_avg_network * (base_stats.deficit_d0 / NULLIF(base_stats.norm_network, (0)::numeric))) * (100)::numeric) AS risk_index
           FROM base_stats
          WHERE ((base_stats.deficit_d0 > (0)::numeric) OR (base_stats.zero_shops > 0))
        ), with_portions AS (
         SELECT n.product_id,
            n.product_name,
            n.category_name,
            n.daily_avg_network,
            n.effective_stock_d0,
            n.deficit_d0,
            n.zero_shops,
            n.norm_network,
            n.raw_need,
            n.risk_index,
            pc.portion_size,
            (ceil((n.raw_need / pc.portion_size)) * pc.portion_size) AS base_qty
           FROM (with_need n
             LEFT JOIN graviton.production_catalog pc ON ((n.product_id = pc.product_id)))
        ), ranked AS (
         SELECT with_portions.product_id,
            with_portions.product_name,
            with_portions.category_name,
            with_portions.daily_avg_network,
            with_portions.effective_stock_d0,
            with_portions.deficit_d0,
            with_portions.zero_shops,
            with_portions.norm_network,
            with_portions.raw_need,
            with_portions.risk_index,
            with_portions.portion_size,
            with_portions.base_qty,
            row_number() OVER (ORDER BY with_portions.risk_index DESC) AS rank,
            sum(with_portions.base_qty) OVER (ORDER BY with_portions.risk_index DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
           FROM with_portions
        )
 SELECT ranked.rank,
    ranked.product_id,
    ranked.product_name,
    ranked.category_name,
    ranked.daily_avg_network AS daily_avg,
    ranked.effective_stock_d0,
    ranked.deficit_d0,
    ranked.raw_need,
    ranked.portion_size,
    ranked.base_qty,
        CASE
            WHEN (ranked.running_total <= (495)::numeric) THEN ranked.base_qty
            ELSE (0)::numeric
        END AS final_qty,
    ranked.risk_index,
    ranked.zero_shops
   FROM ranked
  WHERE (ranked.running_total <= (495)::numeric)
  ORDER BY ranked.rank;
```

### v_graviton_production_tasks_test
```sql
 SELECT v_production_tasks_test.product_id,
    v_production_tasks_test.product_name,
    v_production_tasks_test.business_date,
    v_production_tasks_test.category_id,
    v_production_tasks_test.category_name,
    v_production_tasks_test.total_demand_kg,
    v_production_tasks_test.portion_weight_kg,
    v_production_tasks_test.unit,
    v_production_tasks_test.portions_needed,
    v_production_tasks_test.actual_production_kg,
    v_production_tasks_test.in_production_catalog
   FROM graviton.v_production_tasks_test;
```

### v_graviton_critical_d2
```sql
 SELECT f_calculate_evening_d2.out_product_name AS product_name,
    count(*) FILTER (WHERE (f_calculate_evening_d2.out_stock_d2_evening <= (0)::numeric)) AS zeros_d2,
    sum(
        CASE
            WHEN (f_calculate_evening_d2.out_deficit_d2 > (0)::numeric) THEN f_calculate_evening_d2.out_deficit_d2
            ELSE (0)::numeric
        END) AS deficit_d2,
    sum(f_calculate_evening_d2.out_stock_d2_evening) AS total_stock_d2
   FROM graviton.f_calculate_evening_d2() f_calculate_evening_d2(out_product_id, out_product_name, out_spot_name, out_stock_d0, out_stock_d1_evening, out_allocated_qty, out_stock_d2_morning, out_stock_d2_evening, out_avg_sales_day, out_min_stock, out_deficit_d2)
  GROUP BY f_calculate_evening_d2.out_product_name
 HAVING ((count(*) FILTER (WHERE (f_calculate_evening_d2.out_stock_d2_evening <= (0)::numeric)) > 0) OR (sum(
        CASE
            WHEN (f_calculate_evening_d2.out_deficit_d2 > (0)::numeric) THEN f_calculate_evening_d2.out_deficit_d2
            ELSE (0)::numeric
        END) > (0)::numeric))
  ORDER BY (count(*) FILTER (WHERE (f_calculate_evening_d2.out_stock_d2_evening <= (0)::numeric))) DESC, (sum(
        CASE
            WHEN (f_calculate_evening_d2.out_deficit_d2 > (0)::numeric) THEN f_calculate_evening_d2.out_deficit_d2
            ELSE (0)::numeric
        END)) DESC;
```

### v_graviton_plan_d2
```sql
 SELECT f_calculate_evening_d2.out_product_name AS product_name,
    sum(f_calculate_evening_d2.out_allocated_qty) AS allocated_d2,
    row_number() OVER (ORDER BY (sum(f_calculate_evening_d2.out_allocated_qty)) DESC) AS rank
   FROM graviton.f_calculate_evening_d2() f_calculate_evening_d2(out_product_id, out_product_name, out_spot_name, out_stock_d0, out_stock_d1_evening, out_allocated_qty, out_stock_d2_morning, out_stock_d2_evening, out_avg_sales_day, out_min_stock, out_deficit_d2)
  GROUP BY f_calculate_evening_d2.out_product_name
 HAVING (sum(f_calculate_evening_d2.out_allocated_qty) > (0)::numeric)
  ORDER BY (sum(f_calculate_evening_d2.out_allocated_qty)) DESC;
```

### v_graviton_critical_d3
```sql
 SELECT f_calculate_evening_d3.result_product_name AS product_name,
    count(*) FILTER (WHERE (f_calculate_evening_d3.result_stock_d3_evening <= (0)::numeric)) AS zeros_d3,
    sum(
        CASE
            WHEN (f_calculate_evening_d3.result_deficit_d3 > (0)::numeric) THEN f_calculate_evening_d3.result_deficit_d3
            ELSE (0)::numeric
        END) AS deficit_d3,
    sum(f_calculate_evening_d3.result_stock_d3_evening) AS total_stock_d3
   FROM graviton.f_calculate_evening_d3() f_calculate_evening_d3(result_product_id, result_product_name, result_spot_name, result_stock_d2_evening, result_allocated_qty, result_stock_d3_morning, result_stock_d3_evening, result_avg_sales_day, result_min_stock, result_deficit_d3)
  GROUP BY f_calculate_evening_d3.result_product_name
 HAVING ((count(*) FILTER (WHERE (f_calculate_evening_d3.result_stock_d3_evening <= (0)::numeric)) > 0) OR (sum(
        CASE
            WHEN (f_calculate_evening_d3.result_deficit_d3 > (0)::numeric) THEN f_calculate_evening_d3.result_deficit_d3
            ELSE (0)::numeric
        END) > (0)::numeric))
  ORDER BY (count(*) FILTER (WHERE (f_calculate_evening_d3.result_stock_d3_evening <= (0)::numeric))) DESC, (sum(
        CASE
            WHEN (f_calculate_evening_d3.result_deficit_d3 > (0)::numeric) THEN f_calculate_evening_d3.result_deficit_d3
            ELSE (0)::numeric
        END)) DESC;
```

### v_production_tasks
```sql
 SELECT dr.product_id,
    dr.product_name,
    dr.business_date,
    pc.category_id,
    pc.category_name,
    sum(dr.quantity_to_ship) AS total_demand_kg,
    pc.portion_size AS portion_weight_kg,
    pc.unit,
    ceil(((sum(dr.quantity_to_ship))::numeric / pc.portion_size)) AS portions_needed,
    (ceil(((sum(dr.quantity_to_ship))::numeric / pc.portion_size)) * pc.portion_size) AS actual_production_kg,
    pc.is_active AS in_production_catalog
   FROM (graviton.distribution_results dr
     LEFT JOIN graviton.production_catalog pc ON ((dr.product_id = pc.product_id)))
  WHERE (dr.business_date = CURRENT_DATE)
  GROUP BY dr.product_id, dr.product_name, dr.business_date, pc.category_id, pc.category_name, pc.portion_size, pc.unit, pc.is_active
  ORDER BY pc.category_name, dr.product_name;
```

### production_today
```sql
 SELECT mi.product_id AS "код_продукту",
    mi.product_name AS "назва_продукту",
    sum(mi.quantity) AS "вироблено_кількість",
    count(DISTINCT m.manufacture_id) AS "кількість_виробництв",
    min(m.manufacture_date) AS "перше_виробництво",
    max(m.manufacture_date) AS "останнє_виробництво"
   FROM (graviton.manufactures m
     JOIN graviton.manufacture_items mi ON ((mi.manufacture_id = m.manufacture_id)))
  WHERE ((m.storage_id = 2) AND (date(m.manufacture_date) = ( SELECT max(date(manufactures.manufacture_date)) AS max
           FROM graviton.manufactures
          WHERE (manufactures.storage_id = 2))) AND (mi.is_deleted IS NOT TRUE))
  GROUP BY mi.product_id, mi.product_name
  ORDER BY (sum(mi.quantity)) DESC;
```

### v_production_logic
```sql
 SELECT mi.product_id,
    max(mi.product_name) AS product_name,
    (round(sum(mi.quantity)))::integer AS baked_qty
   FROM (graviton.manufacture_items mi
     JOIN graviton.manufactures m ON ((m.manufacture_id = mi.manufacture_id)))
  WHERE ((m.manufacture_date >= CURRENT_DATE) AND (mi.is_deleted IS NOT TRUE) AND (m.storage_id = 2))
  GROUP BY mi.product_id;
```

### v_effective_stocks
```sql
 SELECT s.storage_id,
    st.storage_name,
    s.ingredient_id,
    s.ingredient_name,
    s.storage_ingredient_left AS physical_stock,
    COALESCE(pending.pending_qty, (0)::bigint) AS virtual_stock,
    (s.storage_ingredient_left + (COALESCE(pending.pending_qty, (0)::bigint))::numeric) AS effective_stock,
    s.ingredient_unit
   FROM ((graviton.stocks_now s
     JOIN categories.storages st ON ((st.storage_id = s.storage_id)))
     LEFT JOIN ( SELECT dr.spot_name,
            dr.product_name,
            sum(dr.quantity_to_ship) AS pending_qty
           FROM graviton.distribution_results dr
          WHERE ((dr.delivery_status = 'pending'::text) AND (dr.business_date = CURRENT_DATE))
          GROUP BY dr.spot_name, dr.product_name) pending ON (((pending.spot_name = st.storage_name) AND (pending.product_name = s.ingredient_name))))
  WHERE (s.ingredient_id IN ( SELECT production_catalog.product_id
           FROM graviton.production_catalog
          WHERE (production_catalog.is_active = true)));
```

### v_graviton_stats
```sql
 SELECT db."код_продукту" AS product_id,
    db."назва_продукту" AS product_name,
    db.category_name,
    db."код_магазину" AS storage_id,
    db."назва_магазину" AS spot_name,
    db.current_stock AS stock_now,
    db.avg_sales_day,
    db.min_stock,
    GREATEST((0)::numeric, (db.min_stock - db.current_stock)) AS deficit
   FROM graviton.distribution_base db
  WHERE ((db."код_продукту" IN ( SELECT production_catalog.product_id
           FROM graviton.production_catalog
          WHERE (production_catalog.is_active = true))) AND (db."код_магазину" = ANY (ARRAY[1, 6, 10, 15, 16, 17])));
```

### v_graviton_stats_with_effective_stock
```sql
 SELECT gs.product_id,
    gs.product_name,
    gs.category_name,
    gs.storage_id,
    gs.spot_name,
    gs.stock_now,
    gs.avg_sales_day,
    gs.min_stock,
    gs.deficit,
    COALESCE(ve.physical_stock, gs.stock_now) AS physical_stock,
    COALESCE(ve.virtual_stock, (0)::bigint) AS virtual_stock,
    COALESCE(ve.effective_stock, gs.stock_now) AS effective_stock
   FROM (graviton.v_graviton_stats gs
     LEFT JOIN graviton.v_effective_stocks ve ON (((ve.ingredient_id = gs.product_id) AND (ve.storage_id = gs.storage_id))));
```

### distribution_base
```sql
 WITH mapping AS (
         SELECT t.spot_id,
            t.storage_id,
            t.shop_name
           FROM ( VALUES (3,3,'Магазин "Кварц"'::text), (6,6,'Магазин "Руська"'::text), (10,25,'Магазин "Садгора"'::text), (16,39,'Магазин "Хотинська"'::text), (17,53,'Магазин "Компас"'::text), (20,44,'Магазин "Білоруська"'::text)) t(spot_id, storage_id, shop_name)
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
         SELECT ds.storage_id,
            ds.ingredient_name,
            sum(ds.storage_ingredient_left) AS current_stock
           FROM graviton.daily_snapshots ds
          WHERE (ds.snapshot_date = ( SELECT max(daily_snapshots.snapshot_date) AS max
                   FROM graviton.daily_snapshots))
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
```

### distribution_base_test
```sql
 WITH mapping AS (
         SELECT t.spot_id,
            t.storage_id,
            t.shop_name
           FROM ( VALUES (3,3,'Магазин "Кварц"'::text), (6,6,'Магазин "Руська"'::text), (10,25,'Магазин "Садгора"'::text), (16,39,'Магазин "Хотинська"'::text), (17,53,'Магазин "Компас"'::text), (20,44,'Магазин "Білоруська"'::text)) t(spot_id, storage_id, shop_name)
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
         SELECT ds.storage_id,
            ds.ingredient_name,
            sum(ds.storage_ingredient_left) AS current_stock
           FROM graviton.daily_snapshots ds
          WHERE (ds.snapshot_date = ( SELECT max(daily_snapshots.snapshot_date) AS max
                   FROM graviton.daily_snapshots))
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
```

### v_production_logic_test
```sql
 SELECT mi.product_id,
    max(mi.product_name) AS product_name,
    (round(sum(mi.quantity)))::integer AS baked_qty
   FROM ((graviton.manufacture_items mi
     JOIN graviton.manufactures m ON ((m.manufacture_id = mi.manufacture_id)))
     JOIN graviton.production_catalog pc ON (((mi.product_id = pc.product_id) AND (pc.is_active = true))))
  WHERE ((m.manufacture_date >= CURRENT_DATE) AND (mi.is_deleted IS NOT TRUE) AND (m.storage_id = 2))
  GROUP BY mi.product_id;
```

### v_production_tasks_test
```sql
 SELECT dr.product_id,
    dr.product_name,
    dr.business_date,
    pc.category_id,
    pc.category_name,
    sum(dr.quantity_to_ship) AS total_demand_kg,
    pc.portion_size AS portion_weight_kg,
    pc.unit,
    ceil(((sum(dr.quantity_to_ship))::numeric / pc.portion_size)) AS portions_needed,
    (ceil(((sum(dr.quantity_to_ship))::numeric / pc.portion_size)) * pc.portion_size) AS actual_production_kg,
    pc.is_active AS in_production_catalog
   FROM (graviton.distribution_results dr
     JOIN graviton.production_catalog pc ON (((dr.product_id = pc.product_id) AND (pc.is_active = true))))
  WHERE (dr.business_date = CURRENT_DATE)
  GROUP BY dr.product_id, dr.product_name, dr.business_date, pc.category_id, pc.category_name, pc.portion_size, pc.unit, pc.is_active
  ORDER BY pc.category_name, dr.product_name;
```

## Functions (RPCs)
### graviton_plan_d2
```sql
CREATE OR REPLACE FUNCTION public.graviton_plan_d2()
 RETURNS TABLE(result_product_id integer, result_product_name text, result_spot_name text, result_stock_d2_evening text, result_allocated_d2 text, result_stock_d3_morning text, result_stock_d3_evening text, result_avg_sales_day text, result_min_stock text, result_deficit_d3 text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT * FROM graviton.f_calculate_evening_d3();
$function$

```

### graviton_critical_d3
```sql
CREATE OR REPLACE FUNCTION public.graviton_critical_d3()
 RETURNS TABLE(result_product_id integer, result_product_name text, result_spot_name text, result_stock_d2_evening text, result_allocated_d2 text, result_stock_d3_morning text, result_stack_d3_evening text, result_avg_sales_day text, result_min_stock text, result_deficit_d3 text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT * FROM graviton.f_calculate_evening_d3();
$function$

```

### deactivate_production_item
```sql
CREATE OR REPLACE FUNCTION graviton.deactivate_production_item(p_product_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE graviton.production_catalog
  SET is_active = FALSE
  WHERE product_id = p_product_id;
  
  RETURN FOUND;
END;
$function$

```

### fn_run_distribution
```sql
CREATE OR REPLACE FUNCTION graviton.fn_run_distribution(p_product_id bigint, p_batch_id uuid, p_business_date date)
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
        FLOOR(COALESCE("current_stock", 0))::int as current_stock,
        0 as final_qty,
        0 as temp_need
    FROM graviton.distribution_base
    WHERE TRIM("назва_продукту") = (SELECT TRIM(product_name) FROM graviton.production_catalog WHERE product_id = p_product_id);

    -- ФАЗА 1: НУЛІ
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

    -- ФАЗА 3: НАДЛИШКИ
    WHILE v_pool > 0 AND v_multiplier <= 15 LOOP
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
$function$

```

### fn_run_distribution_v2
```sql
CREATE OR REPLACE FUNCTION graviton.fn_run_distribution_v2(p_product_id integer, p_batch_id uuid, p_business_date date, p_shop_ids integer[] DEFAULT NULL::integer[])
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
        GREATEST(0, "current_stock") as effective_stock,
        0 as final_qty,
        0 as temp_need
    FROM graviton.distribution_base
    WHERE "код_продукту" = p_product_id
      AND "код_магазину" = ANY(p_shop_ids);

    -- [E] ЭТАП 1: НУЛИ
    SELECT COUNT(*) INTO v_zeros_count FROM temp_calc_g WHERE effective_stock = 0;

    IF v_pool <= v_zeros_count THEN
        UPDATE temp_calc_g SET final_qty = 1 
        WHERE spot_name IN (
            SELECT spot_name FROM temp_calc_g 
            WHERE effective_stock = 0 
            ORDER BY avg_sales_day DESC, spot_name ASC 
            LIMIT v_pool
        );
        v_pool := 0;
    ELSE
        UPDATE temp_calc_g SET final_qty = 1 WHERE effective_stock = 0;
        v_pool := v_pool - v_zeros_count;
    END IF;

    -- [F] ЭТАП 2: МИНИМУМЫ
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

    -- [G] ЭТАП 3: ИЗЛИШКИ
    WHILE v_pool > 0 LOOP
        UPDATE temp_calc_g SET temp_need = GREATEST(0, (min_stock * v_multiplier) - (effective_stock + final_qty)) WHERE true;
        SELECT SUM(temp_need) INTO v_total_need FROM temp_calc_g;

        EXIT WHEN v_total_need = 0 OR v_multiplier > 15; 

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

    -- [H] ЗАПИСЬ РЕЗУЛЬТАТОВ
    INSERT INTO graviton.distribution_results (
        product_id, product_name, spot_name, quantity_to_ship, 
        calculation_batch_id, business_date
    )
    SELECT 
        p_product_id, v_product_name, spot_name, final_qty, 
        p_batch_id, p_business_date 
    FROM temp_calc_g 
    WHERE final_qty > 0;

    -- [I] Остаток на складе
    IF v_pool > 0 THEN
         INSERT INTO graviton.distribution_results (
            product_id, product_name, spot_name, quantity_to_ship, 
            calculation_batch_id, business_date
        )
        VALUES (
            p_product_id, v_product_name, 'Остаток на Складе', v_pool, 
            p_batch_id, p_business_date
        );
    END IF;

END;
$function$

```

### fn_run_graviton_calc
```sql
CREATE OR REPLACE FUNCTION public.fn_run_graviton_calc()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    r RECORD;
    v_batch_id UUID := gen_random_uuid();
    v_count INT := 0;
BEGIN
    -- 1. Бежим по списку выпечки (которую мы настроили в v_production_logic)
    FOR r IN (SELECT product_id FROM graviton.v_production_logic) LOOP
        -- Запускаем ваш алгоритм для каждого продукта
        PERFORM graviton.fn_run_distribution(r.product_id, v_batch_id, CURRENT_DATE);
        v_count := v_count + 1;
    END LOOP;

    -- 2. Возвращаем результат для фронтенда (чтобы крутилка остановилась)
    RETURN json_build_object(
        'status', 'success', 
        'message', format('Распределено %s товаров', v_count),
        'batch_id', v_batch_id
    );
EXCEPTION WHEN OTHERS THEN
    -- Если ошибка - сообщаем фронту
    RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$function$

```

### fn_run_distribution
```sql
CREATE OR REPLACE FUNCTION graviton.fn_run_distribution(p_product_id integer, p_batch_id uuid, p_business_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Просто вызываем BIGINT версию
    PERFORM graviton.fn_run_distribution(p_product_id::BIGINT, p_batch_id, p_business_date);
END;
$function$

```

### get_daily_capacity
```sql
CREATE OR REPLACE FUNCTION graviton.get_daily_capacity()
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT 495::NUMERIC;  -- 9 человек × 55 кг
$function$

```

### graviton_plan_d1
```sql
CREATE OR REPLACE FUNCTION public.graviton_plan_d1()
 RETURNS TABLE(rank integer, product_id integer, product_name text, category_name text, daily_avg numeric, effective_stock_d0 numeric, deficit_d0 numeric, raw_need numeric, portion_size numeric, base_qty numeric, final_qty numeric, risk_index numeric, zero_shops integer)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT * FROM graviton.f_plan_production_1day() ORDER BY rank;
$function$

```

### graviton_critical_d2
```sql
CREATE OR REPLACE FUNCTION public.graviton_critical_d2()
 RETURNS TABLE(out_product_id integer, out_product_name text, out_spot_name text, out_stock_d0 text, out_stock_d1_evening text, out_allocated_qty text, out_stock_d2_morning text, out_stock_d2_evening text, out_avg_sales_day text, out_min_stock text, out_deficit_d2 text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT * FROM graviton.f_calculate_evening_d2();
$function$

```

### cleanup_distribution_results
```sql
CREATE OR REPLACE FUNCTION graviton.cleanup_distribution_results(p_date date)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM graviton.distribution_results
    WHERE business_date = p_date;
    
    RETURN 'Cleaned for ' || p_date;
END;
$function$

```

### fn_orchestrate_distribution
```sql
CREATE OR REPLACE FUNCTION graviton.fn_orchestrate_distribution(p_business_date date DEFAULT CURRENT_DATE, p_shop_ids integer[] DEFAULT NULL::integer[])
 RETURNS TABLE(batch_id uuid, status text, products_processed integer, total_kg numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET statement_timeout TO '300s'
AS $function$
DECLARE
    v_batch_id uuid;
    v_product record;
    v_total_kg numeric := 0;
    v_count int := 0;
    v_log_id uuid;
BEGIN
    -- 1. CLEANUP: Удалить старые данные за эту дату
    DELETE FROM graviton.distribution_results 
    WHERE business_date = p_business_date;
    
    -- 2. Создать batch_id (backend ответственность!)
    v_batch_id := gen_random_uuid();
    
    -- 3. Лог СТАРТ
    INSERT INTO graviton.distribution_logs (
        batch_id,
        business_date,
        status,
        shop_ids_selected,
        started_at
    ) VALUES (
        v_batch_id,
        p_business_date,
        'running',
        p_shop_ids,
        now()
    ) RETURNING id INTO v_log_id;
    
    -- 4. Запустить распределение для каждого товара из производства
    FOR v_product IN 
        SELECT product_id 
        FROM graviton.v_production_logic
        WHERE baked_qty > 0
    LOOP
        BEGIN
            -- Вызов НОВОЙ версии функции (v2)
            PERFORM graviton.fn_run_distribution_v2(
                v_product.product_id,
                v_batch_id,
                p_business_date,
                p_shop_ids
            );
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Логируем ошибку но продолжаем работу
            RAISE WARNING 'Product % failed: %', v_product.product_id, SQLERRM;
            
            UPDATE graviton.distribution_logs
            SET error_message = COALESCE(error_message, '') || 
                'Product ' || v_product.product_id || ': ' || SQLERRM || '; '
            WHERE id = v_log_id;
        END;
    END LOOP;
    
    -- 5. Подсчёт результатов
    SELECT COALESCE(SUM(quantity_to_ship), 0) 
    INTO v_total_kg
    FROM graviton.distribution_results
    WHERE calculation_batch_id = v_batch_id;
    
    -- 6. Лог ЗАВЕРШЕНИЕ
    UPDATE graviton.distribution_logs
    SET 
        status = 'success',
        completed_at = now(),
        products_count = v_count,
        total_kg = v_total_kg
    WHERE id = v_log_id;
    
    -- 7. Вернуть результат
    RETURN QUERY 
    SELECT 
        v_batch_id,
        'success'::text,
        v_count,
        v_total_kg;
    
EXCEPTION WHEN OTHERS THEN
    -- Глобальная ошибка
    UPDATE graviton.distribution_logs
    SET 
        status = 'failed',
        completed_at = now(),
        error_message = SQLERRM
    WHERE id = v_log_id;
    
    RAISE;
END;
$function$

```

### add_production_item
```sql
CREATE OR REPLACE FUNCTION graviton.add_production_item(p_product_id bigint, p_portion_size numeric, p_unit text DEFAULT 'кг'::text)
 RETURNS TABLE(id bigint, category_name text, product_name text, portion_size numeric, unit text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO graviton.production_catalog (
    product_id, 
    category_id, 
    category_name, 
    product_name, 
    portion_size, 
    unit
  )
  SELECT 
    p.id,
    p.category_id,
    c.category_name AS category_name,
    p.name AS product_name,
    p_portion_size,
    p_unit
  FROM categories.products p
  LEFT JOIN categories.categories c ON p.category_id = c.category_id
  WHERE p.id = p_product_id
  ON CONFLICT (product_id) 
  DO UPDATE SET 
    portion_size = EXCLUDED.portion_size,
    unit = EXCLUDED.unit,
    updated_at = now()
  RETURNING 
    graviton.production_catalog.id,
    graviton.production_catalog.category_name,
    graviton.production_catalog.product_name,
    graviton.production_catalog.portion_size,
    graviton.production_catalog.unit;
END;
$function$

```

### update_portion_size
```sql
CREATE OR REPLACE FUNCTION graviton.update_portion_size(p_product_id bigint, p_new_portion_size numeric)
 RETURNS TABLE(product_name text, old_portion_size numeric, new_portion_size numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_old_portion NUMERIC;
  v_product_name TEXT;
BEGIN
  SELECT portion_size, graviton.production_catalog.product_name 
  INTO v_old_portion, v_product_name
  FROM graviton.production_catalog
  WHERE product_id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Товар с product_id = % не найден в каталоге', p_product_id;
  END IF;
  
  UPDATE graviton.production_catalog
  SET portion_size = p_new_portion_size
  WHERE product_id = p_product_id;
  
  RETURN QUERY SELECT v_product_name, v_old_portion, p_new_portion_size;
END;
$function$

```

### tg_fn_auto_distribute
```sql
CREATE OR REPLACE FUNCTION graviton.tg_fn_auto_distribute()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Оборачиваем в EXCEPTION чтобы ошибка распределения 
    -- НЕ блокировала запись производства
    BEGIN
        PERFORM graviton.fn_run_distribution(
            NEW.product_id, 
            gen_random_uuid(), 
            CURRENT_DATE
        );
    EXCEPTION WHEN OTHERS THEN
        -- Логируем WARNING но НЕ останавливаем INSERT
        RAISE WARNING 'Авто-распределение для product_id % упало: %', 
            NEW.product_id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$function$

```

### f_plan_production_1day
```sql
CREATE OR REPLACE FUNCTION graviton.f_plan_production_1day()
 RETURNS TABLE(rank integer, product_id integer, product_name text, category_name text, daily_avg numeric, effective_stock_d0 numeric, deficit_d0 numeric, raw_need numeric, portion_size numeric, base_qty numeric, final_qty numeric, risk_index numeric, zero_shops integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_capacity CONSTANT NUMERIC := 495;  -- 9 × 55
    v_running_total NUMERIC := 0;
    v_rec RECORD;
    v_remainder NUMERIC;
    v_top_product_id INT;
    v_top_portion_size NUMERIC;
BEGIN
    DROP TABLE IF EXISTS temp_graviton_order;
    
    CREATE TEMP TABLE temp_graviton_order AS
    WITH base_stats AS (
        SELECT 
            gs.product_id,
            gs.product_name,
            gs.category_name,
            SUM(gs.effective_stock) as total_stock,
            SUM(gs.avg_sales_day) as daily_avg,
            SUM(gs.min_stock) as norm_network,
            SUM(GREATEST(0, gs.min_stock - gs.effective_stock)) as deficit,
            COUNT(*) FILTER (WHERE gs.effective_stock <= 0) as zeros
        FROM graviton.v_graviton_stats_with_effective_stock gs
        GROUP BY gs.product_id, gs.product_name, gs.category_name
        HAVING SUM(GREATEST(0, gs.min_stock - gs.effective_stock)) > 0
    ),
    needs AS (
        SELECT 
            bs.product_id,
            bs.product_name,
            bs.category_name,
            bs.daily_avg,
            bs.total_stock,
            bs.deficit,
            bs.deficit + bs.daily_avg as raw_need,
            ROUND(bs.daily_avg * (bs.deficit::numeric / NULLIF(bs.norm_network, 0)) * 100, 0) as risk_idx,
            bs.zeros,
            pc.portion_size,
            CEIL((bs.deficit + bs.daily_avg) / pc.portion_size) * pc.portion_size as base_qty
        FROM base_stats bs
        JOIN graviton.production_catalog pc ON pc.product_id = bs.product_id
    ),
    ranked AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY n.risk_idx DESC, n.product_name)::INT as rnk,
            n.*
        FROM needs n
    )
    SELECT 
        r.rnk,
        r.product_id,
        r.product_name,
        r.category_name,
        r.daily_avg,
        r.total_stock,
        r.deficit,
        r.raw_need,
        r.portion_size,
        r.base_qty,
        0::NUMERIC as final_qty,
        r.risk_idx,
        r.zeros
    FROM ranked r
    ORDER BY r.rnk;
    
    FOR v_rec IN 
        SELECT * FROM temp_graviton_order ORDER BY rnk
    LOOP
        IF v_running_total + v_rec.base_qty <= v_capacity THEN
            -- ✅ ФИКс: явное указание таблицы
            UPDATE temp_graviton_order t
            SET final_qty = v_rec.base_qty
            WHERE t.product_id = v_rec.product_id;
            
            v_running_total := v_running_total + v_rec.base_qty;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    v_remainder := v_capacity - v_running_total;
    
    IF v_remainder > 0 THEN
        SELECT t.product_id, t.portion_size 
        INTO v_top_product_id, v_top_portion_size
        FROM temp_graviton_order t
        WHERE t.final_qty > 0
        ORDER BY t.rnk
        LIMIT 1;
        
        IF v_top_product_id IS NOT NULL AND v_remainder >= v_top_portion_size THEN
            UPDATE temp_graviton_order t
            SET final_qty = t.final_qty + (FLOOR(v_remainder / v_top_portion_size) * v_top_portion_size)
            WHERE t.product_id = v_top_product_id;
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT 
        t.rnk::INT,
        t.product_id::INT,
        t.product_name,
        t.category_name,
        t.daily_avg,
        t.total_stock,
        t.deficit,
        t.raw_need,
        t.portion_size,
        t.base_qty,
        t.final_qty,
        t.risk_idx,
        t.zeros::INT
    FROM temp_graviton_order t
    WHERE t.final_qty > 0
    ORDER BY t.rnk;
    
END;
$function$

```

### f_calculate_evening_d2
```sql
CREATE OR REPLACE FUNCTION graviton.f_calculate_evening_d2()
 RETURNS TABLE(out_product_id integer, out_product_name text, out_spot_name text, out_stock_d0 numeric, out_stock_d1_evening numeric, out_allocated_qty numeric, out_stock_d2_morning numeric, out_stock_d2_evening numeric, out_avg_sales_day numeric, out_min_stock numeric, out_deficit_d2 numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order_rec RECORD;
    v_pool NUMERIC;
    v_zeros_count INT;
    v_total_need NUMERIC;
    v_remainder NUMERIC;
    v_multiplier INT;
    v_k NUMERIC;
BEGIN
    DROP TABLE IF EXISTS temp_order_d1;
    DROP TABLE IF EXISTS temp_evening_d1;
    
    CREATE TEMP TABLE temp_order_d1 AS
    SELECT product_id, product_name, final_qty 
    FROM graviton.f_plan_production_1day()
    WHERE final_qty > 0;
    
    CREATE TEMP TABLE temp_evening_d1 AS
    SELECT 
        product_id::int,
        product_name,
        spot_name,
        FLOOR(effective_stock + 0.3)::numeric as d0_stock,
        GREATEST(0, FLOOR(effective_stock - avg_sales_day + 0.3))::numeric as d1_eve_stock,
        avg_sales_day::numeric as sales_avg,
        min_stock::numeric as norm_stock,
        0::numeric as alloc_qty
    FROM graviton.v_graviton_stats_with_effective_stock;
    
    FOR v_order_rec IN SELECT * FROM temp_order_d1 LOOP
        v_pool := v_order_rec.final_qty;
        
        DROP TABLE IF EXISTS temp_calc;
        CREATE TEMP TABLE temp_calc AS
        SELECT 
            spot_name,
            sales_avg,
            norm_stock,
            d1_eve_stock as eff_stock,
            0::numeric as fin_qty,
            0::numeric as tmp_need
        FROM temp_evening_d1
        WHERE product_id = v_order_rec.product_id;
        
        -- ФАЗА 1: НУЛИ
        SELECT COUNT(*) INTO v_zeros_count FROM temp_calc WHERE eff_stock <= 0;
        
        IF v_pool <= v_zeros_count THEN
            UPDATE temp_calc SET fin_qty = 1 
            WHERE spot_name IN (
                SELECT spot_name FROM temp_calc 
                WHERE eff_stock <= 0 
                ORDER BY sales_avg DESC, spot_name ASC 
                LIMIT v_pool::int
            );
            v_pool := 0;
        ELSE
            UPDATE temp_calc SET fin_qty = 1 WHERE eff_stock <= 0;
            v_pool := v_pool - v_zeros_count;
        END IF;
        
        -- ФАЗА 2: МИНИМУМЫ
        IF v_pool > 0 THEN
            UPDATE temp_calc 
            SET tmp_need = GREATEST(0, norm_stock - (eff_stock + fin_qty))
            WHERE TRUE;  -- ✅ WHERE TRUE
            
            SELECT SUM(tmp_need) INTO v_total_need FROM temp_calc;
            
            IF v_total_need > 0 THEN
                IF v_pool < v_total_need THEN
                    v_k := v_pool::numeric / v_total_need::numeric;
                    UPDATE temp_calc 
                    SET fin_qty = fin_qty + FLOOR(tmp_need * v_k)
                    WHERE TRUE;  -- ✅ WHERE TRUE
                    
                    SELECT (v_pool - SUM(FLOOR(tmp_need * v_k)))::numeric INTO v_remainder FROM temp_calc;
                    IF v_remainder > 0 THEN
                        UPDATE temp_calc SET fin_qty = fin_qty + 1 
                        WHERE spot_name IN (
                            SELECT spot_name FROM temp_calc 
                            WHERE tmp_need > 0
                            ORDER BY sales_avg DESC, spot_name ASC
                            LIMIT v_remainder::int
                        );
                    END IF;
                    v_pool := 0;
                ELSE
                    UPDATE temp_calc 
                    SET fin_qty = fin_qty + tmp_need
                    WHERE TRUE;  -- ✅ WHERE TRUE
                    v_pool := v_pool - v_total_need;
                END IF;
            END IF;
        END IF;
        
        -- ФАЗА 3: ИЗЛИШКИ
        v_multiplier := 2;
        WHILE v_pool > 0 LOOP
            UPDATE temp_calc 
            SET tmp_need = GREATEST(0, (norm_stock * v_multiplier) - (eff_stock + fin_qty))
            WHERE TRUE;  -- ✅ WHERE TRUE
            
            SELECT SUM(tmp_need) INTO v_total_need FROM temp_calc;
            
            EXIT WHEN v_total_need = 0 OR v_multiplier > 15;
            
            IF v_pool < v_total_need THEN
                v_k := v_pool::numeric / v_total_need::numeric;
                UPDATE temp_calc 
                SET fin_qty = fin_qty + FLOOR(tmp_need * v_k)
                WHERE TRUE;  -- ✅ WHERE TRUE
                
                SELECT (v_pool - SUM(FLOOR(tmp_need * v_k)))::numeric INTO v_remainder FROM temp_calc;
                IF v_remainder > 0 THEN
                    UPDATE temp_calc SET fin_qty = fin_qty + 1 
                    WHERE spot_name IN (
                        SELECT spot_name FROM temp_calc 
                        WHERE tmp_need > 0
                        ORDER BY sales_avg DESC, spot_name ASC
                        LIMIT v_remainder::int
                    );
                END IF;
                v_pool := 0;
            ELSE
                UPDATE temp_calc 
                SET fin_qty = fin_qty + tmp_need
                WHERE TRUE;  -- ✅ WHERE TRUE
                v_pool := v_pool - v_total_need;
                v_multiplier := v_multiplier + 1;
            END IF;
        END LOOP;
        
        UPDATE temp_evening_d1 e
        SET alloc_qty = c.fin_qty
        FROM temp_calc c
        WHERE e.product_id = v_order_rec.product_id
            AND e.spot_name = c.spot_name;
            
        DROP TABLE temp_calc;
    END LOOP;
    
    RETURN QUERY
    SELECT 
        e.product_id::INT,
        e.product_name::TEXT,
        e.spot_name::TEXT,
        e.d0_stock::NUMERIC,  -- ✅ NUMERIC!
        e.d1_eve_stock::NUMERIC,
        e.alloc_qty::NUMERIC,
        (e.d1_eve_stock + e.alloc_qty)::NUMERIC,
        GREATEST(0, FLOOR((e.d1_eve_stock + e.alloc_qty) - e.sales_avg + 0.3))::NUMERIC,
        e.sales_avg::NUMERIC,
        e.norm_stock::NUMERIC,
        GREATEST(0, e.norm_stock - GREATEST(0, FLOOR((e.d1_eve_stock + e.alloc_qty) - e.sales_avg + 0.3)))::NUMERIC
    FROM temp_evening_d1 e
    ORDER BY e.product_name, e.spot_name;
    
END;
$function$

```

### f_calculate_evening_d3
```sql
CREATE OR REPLACE FUNCTION graviton.f_calculate_evening_d3()
 RETURNS TABLE(result_product_id integer, result_product_name text, result_spot_name text, result_stock_d2_evening numeric, result_allocated_qty numeric, result_stock_d3_morning numeric, result_stock_d3_evening numeric, result_avg_sales_day numeric, result_min_stock numeric, result_deficit_d3 numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_capacity CONSTANT NUMERIC := 495;
    v_running_total NUMERIC := 0;
    v_order_rec RECORD;
    v_pool NUMERIC;
    v_zeros_count INT;
    v_total_need NUMERIC;
    v_remainder NUMERIC;
    v_multiplier INT;
    v_k NUMERIC;
BEGIN
    DROP TABLE IF EXISTS temp_evening_d2_g3;
    DROP TABLE IF EXISTS temp_order_d2_g3;
    
    CREATE TEMP TABLE temp_evening_d2_g3 AS
    SELECT 
        out_product_id::int as product_id,
        out_product_name as product_name,
        out_spot_name as spot_name,
        out_stock_d2_evening as d2_eve_stock,
        out_avg_sales_day as sales_avg,
        out_min_stock as norm_stock,
        0::numeric as alloc_qty
    FROM graviton.f_calculate_evening_d2();
    
    CREATE TEMP TABLE temp_order_d2_g3 AS
    WITH d2_stats AS (
        SELECT 
            product_id,
            product_name,
            SUM(GREATEST(0, norm_stock - d2_eve_stock)) as deficit,
            SUM(sales_avg) as daily_avg,
            SUM(norm_stock) as norm_network
        FROM temp_evening_d2_g3
        GROUP BY product_id, product_name
        HAVING SUM(GREATEST(0, norm_stock - d2_eve_stock)) > 0
    )
    SELECT 
        s.product_id,
        s.product_name,
        ROUND(s.daily_avg * (s.deficit / NULLIF(s.norm_network, 0)) * 100, 0) as risk_idx,
        pc.portion_size,
        CEIL((s.deficit + s.daily_avg) / pc.portion_size) * pc.portion_size as base_qty,
        0::numeric as final_qty
    FROM d2_stats s
    JOIN graviton.production_catalog pc ON pc.product_id = s.product_id
    ORDER BY risk_idx DESC, s.product_name;
    
    FOR v_order_rec IN 
        SELECT * FROM temp_order_d2_g3 ORDER BY risk_idx DESC
    LOOP
        IF v_running_total + v_order_rec.base_qty <= v_capacity THEN
            UPDATE temp_order_d2_g3 t
            SET final_qty = v_order_rec.base_qty
            WHERE t.product_id = v_order_rec.product_id;
            
            v_running_total := v_running_total + v_order_rec.base_qty;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    FOR v_order_rec IN 
        SELECT * FROM temp_order_d2_g3 WHERE final_qty > 0
    LOOP
        v_pool := v_order_rec.final_qty;
        
        DROP TABLE IF EXISTS temp_calc_g3;
        CREATE TEMP TABLE temp_calc_g3 AS
        SELECT 
            spot_name,
            sales_avg,
            norm_stock,
            d2_eve_stock as eff_stock,
            0::numeric as fin_qty,
            0::numeric as tmp_need
        FROM temp_evening_d2_g3
        WHERE product_id = v_order_rec.product_id;
        
        SELECT COUNT(*) INTO v_zeros_count FROM temp_calc_g3 WHERE eff_stock <= 0;
        
        IF v_zeros_count > 0 THEN
            IF v_pool <= v_zeros_count THEN
                UPDATE temp_calc_g3 SET fin_qty = 1 
                WHERE spot_name IN (
                    SELECT spot_name FROM temp_calc_g3 
                    WHERE eff_stock <= 0 
                    ORDER BY sales_avg DESC
                    LIMIT v_pool::int
                );
                v_pool := 0;
            ELSE
                UPDATE temp_calc_g3 SET fin_qty = 1 WHERE eff_stock <= 0;
                v_pool := v_pool - v_zeros_count;
            END IF;
        END IF;
        
        IF v_pool > 0 THEN
            UPDATE temp_calc_g3 
            SET tmp_need = GREATEST(0, norm_stock - (eff_stock + fin_qty))
            WHERE TRUE;
            
            SELECT SUM(tmp_need) INTO v_total_need FROM temp_calc_g3;
            
            IF v_total_need > 0 THEN
                IF v_pool < v_total_need THEN
                    v_k := v_pool / v_total_need;
                    UPDATE temp_calc_g3 
                    SET fin_qty = fin_qty + FLOOR(tmp_need * v_k)
                    WHERE TRUE;
                    
                    v_remainder := v_pool - (SELECT SUM(FLOOR(tmp_need * v_k)) FROM temp_calc_g3);
                    
                    IF v_remainder > 0 THEN
                        UPDATE temp_calc_g3 SET fin_qty = fin_qty + 1 
                        WHERE spot_name IN (
                            SELECT spot_name FROM temp_calc_g3 
                            WHERE tmp_need > 0
                            ORDER BY sales_avg DESC
                            LIMIT v_remainder::int
                        );
                    END IF;
                    v_pool := 0;
                ELSE
                    UPDATE temp_calc_g3 
                    SET fin_qty = fin_qty + tmp_need
                    WHERE TRUE;
                    v_pool := v_pool - v_total_need;
                END IF;
            END IF;
        END IF;
        
        v_multiplier := 2;
        WHILE v_pool > 0 AND v_multiplier <= 15 LOOP
            UPDATE temp_calc_g3 
            SET tmp_need = GREATEST(0, (norm_stock * v_multiplier) - (eff_stock + fin_qty))
            WHERE TRUE;
            
            SELECT SUM(tmp_need) INTO v_total_need FROM temp_calc_g3;
            
            EXIT WHEN v_total_need = 0;
            
            IF v_pool < v_total_need THEN
                v_k := v_pool / v_total_need;
                UPDATE temp_calc_g3 
                SET fin_qty = fin_qty + FLOOR(tmp_need * v_k)
                WHERE TRUE;
                
                v_remainder := v_pool - (SELECT SUM(FLOOR(tmp_need * v_k)) FROM temp_calc_g3);
                
                IF v_remainder > 0 THEN
                    UPDATE temp_calc_g3 SET fin_qty = fin_qty + 1 
                    WHERE spot_name IN (
                        SELECT spot_name FROM temp_calc_g3 
                        WHERE tmp_need > 0
                        ORDER BY sales_avg DESC
                        LIMIT v_remainder::int
                    );
                END IF;
                v_pool := 0;
            ELSE
                UPDATE temp_calc_g3 
                SET fin_qty = fin_qty + tmp_need
                WHERE TRUE;
                v_pool := v_pool - v_total_need;
                v_multiplier := v_multiplier + 1;
            END IF;
        END LOOP;
        
        UPDATE temp_evening_d2_g3 e
        SET alloc_qty = c.fin_qty
        FROM temp_calc_g3 c
        WHERE e.product_id = v_order_rec.product_id
            AND e.spot_name = c.spot_name;
    END LOOP;
    
    RETURN QUERY
    SELECT 
        e.product_id::INT,
        e.product_name::TEXT,
        e.spot_name::TEXT,
        e.d2_eve_stock::NUMERIC,
        e.alloc_qty::NUMERIC,
        (e.d2_eve_stock + e.alloc_qty)::NUMERIC,
        GREATEST(0, FLOOR((e.d2_eve_stock + e.alloc_qty) - e.sales_avg + 0.3))::NUMERIC,
        e.sales_avg::NUMERIC,
        e.norm_stock::NUMERIC,
        GREATEST(0, e.norm_stock - GREATEST(0, FLOOR((e.d2_eve_stock + e.alloc_qty) - e.sales_avg + 0.3)))::NUMERIC
    FROM temp_evening_d2_g3 e
    ORDER BY e.product_name, e.spot_name;
    
END;
$function$

```

## Triggers
### tr_auto_graviton_distribute (on manufacture_items)
- **Timing:** AFTER
- **Event:** INSERT
- **Action:** `EXECUTE FUNCTION graviton.tg_fn_auto_distribute()`

### tr_auto_graviton_distribute (on manufacture_items)
- **Timing:** AFTER
- **Event:** UPDATE
- **Action:** `EXECUTE FUNCTION graviton.tg_fn_auto_distribute()`

### trg_production_catalog_updated_at (on production_catalog)
- **Timing:** BEFORE
- **Event:** UPDATE
- **Action:** `EXECUTE FUNCTION update_updated_at()`


# Graviton Supabase Schema Analysis

## Tables / Views

### `distribution_logs`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Note:
This is a Primary Key.<pk/> | uuid |
| `batch_id` | `string` |  | uuid |
| `business_date` | `string` |  | date |
| `started_at` | `string` |  | timestamp with time zone |
| `completed_at` | `string` |  | timestamp with time zone |
| `status` | `string` |  | text |
| `triggered_by` | `string` |  | uuid |
| `error_message` | `string` |  | text |
| `products_count` | `integer` |  | integer |
| `total_kg` | `number` |  | numeric |
| `shop_ids_selected` | `array` |  | integer[] |

### `manufacture_items`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | Note:
This is a Primary Key.<pk/> | bigint |
| `manufacture_id` | `integer` |  | integer |
| `product_id` | `integer` |  | integer |
| `ingredient_id` | `integer` |  | integer |
| `product_name` | `string` |  | text |
| `quantity` | `number` |  | numeric |
| `type` | `integer` |  | integer |
| `is_deleted` | `boolean` |  | boolean |

### `distribution_base_test`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `код_магазину` | `integer` |  | integer |
| `назва_магазину` | `string` |  | text |
| `код_продукту` | `integer` | Note:
This is a Primary Key.<pk/> | bigint |
| `назва_продукту` | `string` |  | text |
| `category_name` | `string` |  | text |
| `current_stock` | `number` |  | numeric |
| `avg_sales_day` | `number` |  | numeric |
| `min_stock` | `number` |  | numeric |
| `deficit_kg` | `number` |  | numeric |

### `distribution_base`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `код_магазину` | `integer` |  | integer |
| `назва_магазину` | `string` |  | text |
| `код_продукту` | `integer` | Note:
This is a Primary Key.<pk/> | bigint |
| `назва_продукту` | `string` |  | text |
| `category_name` | `string` |  | text |
| `current_stock` | `number` |  | numeric |
| `avg_sales_day` | `number` |  | numeric |
| `min_stock` | `number` |  | numeric |
| `deficit_kg` | `number` |  | numeric |

### `production_today`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `код_продукту` | `integer` |  | integer |
| `назва_продукту` | `string` |  | text |
| `вироблено_кількість` | `number` |  | numeric |
| `кількість_виробництв` | `integer` |  | bigint |
| `перше_виробництво` | `string` |  | timestamp without time zone |
| `останнє_виробництво` | `string` |  | timestamp without time zone |

### `v_graviton_stats`
Статистика по продуктам: текущие остатки, средние продажи, нормы, дефициты

| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `product_id` | `integer` | Note:
This is a Primary Key.<pk/> | bigint |
| `product_name` | `string` |  | text |
| `category_name` | `string` |  | text |
| `storage_id` | `integer` |  | integer |
| `spot_name` | `string` |  | text |
| `stock_now` | `number` |  | numeric |
| `avg_sales_day` | `number` |  | numeric |
| `min_stock` | `number` |  | numeric |
| `deficit` | `number` |  | numeric |

### `stocks_now`
Текущие физические остатки на складах магазинов (обновляется каждый вечер из daily_snapshots)

| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `storage_id` | `integer` | Note:
This is a Primary Key.<pk/> | integer |
| `ingredient_id` | `integer` | Note:
This is a Primary Key.<pk/> | integer |
| `ingredient_name` | `string` |  | text |
| `storage_ingredient_left` | `number` |  | numeric |
| `ingredient_unit` | `string` |  | text |
| `updated_at` | `string` |  | timestamp with time zone |

### `manufactures`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `manufacture_id` | `integer` | Note:
This is a Primary Key.<pk/> | integer |
| `storage_id` | `integer` |  | integer |
| `user_id` | `integer` |  | integer |
| `manufacture_date` | `string` |  | timestamp without time zone |
| `total_sum` | `number` |  | numeric |

### `daily_snapshots`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `snapshot_date` | `string` |  | date |
| `storage_id` | `integer` |  | integer |
| `ingredient_id` | `integer` |  | integer |
| `ingredient_name` | `string` |  | text |
| `storage_ingredient_left` | `number` |  | numeric |
| `ingredient_unit` | `string` |  | text |
| `created_at` | `string` |  | timestamp without time zone |

### `v_graviton_stats_with_effective_stock`
ГЛАВНЫЙ VIEW для планирования: статистика + effective_stock (physical + virtual)

| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `product_id` | `integer` | Note:
This is a Primary Key.<pk/> | bigint |
| `product_name` | `string` |  | text |
| `category_name` | `string` |  | text |
| `storage_id` | `integer` |  | integer |
| `spot_name` | `string` |  | text |
| `stock_now` | `number` |  | numeric |
| `avg_sales_day` | `number` |  | numeric |
| `min_stock` | `number` |  | numeric |
| `deficit` | `number` |  | numeric |
| `physical_stock` | `number` |  | numeric |
| `virtual_stock` | `integer` |  | bigint |
| `effective_stock` | `number` |  | numeric |

### `v_production_tasks`
Задания в цех: пересчёт потребности из кг в порции

| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `product_id` | `integer` |  | bigint |
| `product_name` | `string` |  | text |
| `business_date` | `string` |  | date |
| `category_id` | `string` |  | text |
| `category_name` | `string` |  | text |
| `total_demand_kg` | `integer` |  | bigint |
| `portion_weight_kg` | `number` |  | numeric |
| `unit` | `string` |  | text |
| `portions_needed` | `number` |  | numeric |
| `actual_production_kg` | `number` |  | numeric |
| `in_production_catalog` | `boolean` |  | boolean |

### `production_catalog`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | Note:
This is a Primary Key.<pk/> | bigint |
| `product_id` | `integer` |  | bigint |
| `category_id` | `string` |  | text |
| `category_name` | `string` |  | text |
| `product_name` | `string` |  | text |
| `portion_size` | `number` |  | numeric |
| `unit` | `string` |  | text |
| `is_active` | `boolean` |  | boolean |
| `created_at` | `string` |  | timestamp with time zone |
| `updated_at` | `string` |  | timestamp with time zone |

### `v_effective_stocks`
Эффективные остатки = физические (stocks_now) + виртуальные (pending доставки из distribution_results)

| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `storage_id` | `integer` | Note:
This is a Primary Key.<pk/> | integer |
| `storage_name` | `string` |  | text |
| `ingredient_id` | `integer` | Note:
This is a Primary Key.<pk/> | integer |
| `ingredient_name` | `string` |  | text |
| `physical_stock` | `number` |  | numeric |
| `virtual_stock` | `integer` |  | bigint |
| `effective_stock` | `number` |  | numeric |
| `ingredient_unit` | `string` |  | text |

### `v_production_logic`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `product_id` | `integer` |  | integer |
| `product_name` | `string` |  | text |
| `baked_qty` | `integer` |  | integer |

### `v_production_tasks_test`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `product_id` | `integer` |  | bigint |
| `product_name` | `string` |  | text |
| `business_date` | `string` |  | date |
| `category_id` | `string` |  | text |
| `category_name` | `string` |  | text |
| `total_demand_kg` | `integer` |  | bigint |
| `portion_weight_kg` | `number` |  | numeric |
| `unit` | `string` |  | text |
| `portions_needed` | `number` |  | numeric |
| `actual_production_kg` | `number` |  | numeric |
| `in_production_catalog` | `boolean` |  | boolean |

### `distribution_results`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Note:
This is a Primary Key.<pk/> | uuid |
| `product_id` | `integer` |  | bigint |
| `product_name` | `string` |  | text |
| `spot_name` | `string` |  | text |
| `quantity_to_ship` | `integer` |  | integer |
| `calculation_batch_id` | `string` |  | uuid |
| `business_date` | `string` |  | date |
| `created_at` | `string` |  | timestamp with time zone |
| `delivery_status` | `string` | Статус доставки: pending (в пути, Д0→Д2) или delivered (доставлено в магазин) | text |

### `order_log`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `log_id` | `integer` | Note:
This is a Primary Key.<pk/> | bigint |
| `order_date` | `string` |  | date |
| `order_type` | `string` |  | text |
| `order_data` | `unknown` |  | jsonb |
| `total_kg` | `number` |  | numeric |
| `sku_count` | `integer` |  | integer |
| `sent_to_telegram` | `boolean` |  | boolean |
| `telegram_message_id` | `string` |  | text |
| `created_at` | `string` |  | timestamp with time zone |
| `created_by` | `string` |  | text |

### `v_production_logic_test`
| Column | Type | Description | Format |
| :--- | :--- | :--- | :--- |
| `product_id` | `integer` |  | integer |
| `product_name` | `string` |  | text |
| `baked_qty` | `integer` |  | integer |

## Functions (RPCs)

### `update_portion_size`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `fn_run_distribution_v2`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `get_daily_capacity`
**Summary:** Мощность цеха: 9 человек × 55 кг/человек = 495 кг/день

**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `f_plan_production_1day`
**Summary:** Планирование заказа на Д1. Capacity: 495 кг (9 человек × 55 кг)

**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `fn_run_distribution`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `fn_orchestrate_distribution`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `f_calculate_evening_d2`
**Summary:** Симуляция остатков на вечер Д2 после заказа Д1. Capacity фиксирована: 495 кг

**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `f_calculate_evening_d3`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `cleanup_distribution_results`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `deactivate_production_item`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 

### `add_production_item`
**Parameters:**
- `args` (body): 
- `undefined` (undefined): 


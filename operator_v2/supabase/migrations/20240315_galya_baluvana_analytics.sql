-- supabase/migrations/galya_baluvana_analytics.sql

-- 1. Create the unified sales transactions table
CREATE TABLE IF NOT EXISTS public.gb_sales_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_date DATE NOT NULL,
    store_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Піца', 'Хліб', 'Випічка', 'Гравітон', 'Кондитерська')),
    item_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    price_uah NUMERIC NOT NULL DEFAULT 0,
    cost_price_uah NUMERIC NOT NULL DEFAULT 0,
    revenue_uah NUMERIC GENERATED ALWAYS AS (quantity * price_uah) STORED,
    profit_uah NUMERIC GENERATED ALWAYS AS (quantity * (price_uah - cost_price_uah)) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster date and category queries
CREATE INDEX IF NOT EXISTS idx_gb_sales_date_store ON public.gb_sales_transactions(transaction_date, store_name);
CREATE INDEX IF NOT EXISTS idx_gb_sales_category ON public.gb_sales_transactions(category);

-- 2. View for Finance Overview (Aggregated by Store, Category, and Date)
CREATE OR REPLACE VIEW public.v_gb_finance_overview AS
SELECT
    transaction_date,
    store_name,
    category,
    SUM(quantity) AS total_quantity,
    SUM(revenue_uah) AS total_revenue,
    SUM(profit_uah) AS total_profit,
    CASE WHEN SUM(revenue_uah) = 0 THEN 0 ELSE (SUM(profit_uah) / SUM(revenue_uah)) * 100 END AS margin_percent
FROM
    public.gb_sales_transactions
GROUP BY
    transaction_date,
    store_name,
    category;

-- 3. View for overall Brand Financial Summary by Date
CREATE OR REPLACE VIEW public.v_gb_finance_daily_brand AS
SELECT
    transaction_date,
    SUM(quantity) AS total_quantity,
    SUM(revenue_uah) AS total_revenue,
    SUM(profit_uah) AS total_profit
FROM
    public.gb_sales_transactions
GROUP BY
    transaction_date
ORDER BY
    transaction_date DESC;

-- Enable RLS (Assuming authenticated users can read, admin/service can write)
ALTER TABLE public.gb_sales_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all authenticated users on gb_sales_transactions"
    ON public.gb_sales_transactions FOR SELECT TO authenticated USING (true);
    
-- (In a real scenario, you'd add INSERT/UPDATE policies restricted to service roles or specific user roles)

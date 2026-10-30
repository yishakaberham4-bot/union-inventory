-- Run this once in Supabase → SQL Editor
-- Enables stock report (added stock by date / month / range)

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  product_name text,
  product_sku text,
  mode text NOT NULL,          -- add | remove | set | initial
  amount int NOT NULL DEFAULT 0,
  previous_qty int NOT NULL DEFAULT 0,
  new_qty int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx
  ON stock_movements (created_at DESC);

CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx
  ON stock_movements (product_id);

CREATE INDEX IF NOT EXISTS stock_movements_mode_idx
  ON stock_movements (mode);

-- Optional: allow service role full access (usually already true)
-- ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

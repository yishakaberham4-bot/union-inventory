-- Run in Supabase SQL Editor (safe to run multiple times).

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_am text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs';

CREATE INDEX IF NOT EXISTS products_barcode_idx ON products (barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

-- Optional: stock as decimal for kg products (if currently integer, migrate carefully)
-- ALTER TABLE products ALTER COLUMN stock_qty TYPE numeric USING stock_qty::numeric;

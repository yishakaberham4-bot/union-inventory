-- Run in Supabase SQL Editor (safe to run multiple times).

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_am text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs';

-- Allow fractional kg stock and sales (0.1, 5.1, 10.5)
ALTER TABLE products
  ALTER COLUMN stock_qty TYPE numeric USING stock_qty::numeric;

CREATE INDEX IF NOT EXISTS products_barcode_idx ON products (barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

-- Set unit on existing products if needed:
-- UPDATE products SET unit = 'kg' WHERE unit IS NULL AND ...;

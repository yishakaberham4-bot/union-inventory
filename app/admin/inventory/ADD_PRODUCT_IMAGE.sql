-- Run in Supabase SQL Editor (safe to run multiple times).

-- Product photos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url text;

-- Barcode from packaging
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode text;

CREATE INDEX IF NOT EXISTS products_barcode_idx ON products (barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

-- Amharic product name (English stays in column "name")
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_am text;

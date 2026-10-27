-- Run this in Supabase SQL editor (safe to run multiple times).

-- Product photos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url text;

-- Barcode from packaging (for scanner at sales)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode text;

CREATE INDEX IF NOT EXISTS products_barcode_idx ON products (barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

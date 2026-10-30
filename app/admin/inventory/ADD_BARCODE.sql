-- Run in Supabase SQL Editor (safe to run multiple times).
-- Adds barcode support for product packaging codes.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode text;

-- Optional: speed up lookup when scanning at the sales terminal
CREATE INDEX IF NOT EXISTS products_barcode_idx ON products (barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

-- Optional: one barcode per product (uncomment if you want unique barcodes)
-- CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique
--   ON products (barcode)
--   WHERE barcode IS NOT NULL AND barcode <> '';

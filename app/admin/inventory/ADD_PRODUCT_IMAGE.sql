-- Run this in Supabase SQL editor to support product pictures.
-- Safe to run multiple times.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url text;

-- Optional: public storage bucket is created automatically by the app
-- when the first product image is uploaded (bucket name: product-images).

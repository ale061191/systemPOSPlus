-- Add stock_warehouse column to products table
-- Default to 0, ensuring no nulls
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_warehouse integer DEFAULT 0;

-- Optional: Add check constraint to ensure it's non-negative
ALTER TABLE products 
ADD CONSTRAINT check_stock_warehouse_positive CHECK (stock_warehouse >= 0);

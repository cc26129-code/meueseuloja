ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_stock_quantity_non_negative;

ALTER TABLE public.products
ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0);
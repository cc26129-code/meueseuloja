-- Secure Melhor Envio quotes and shipping snapshots for checkout.

ALTER TABLE public.products
  ADD COLUMN weight_kg numeric(10,3),
  ADD COLUMN height_cm numeric(10,2),
  ADD COLUMN width_cm numeric(10,2),
  ADD COLUMN length_cm numeric(10,2);

ALTER TABLE public.products
  ADD CONSTRAINT products_weight_kg_valid
    CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 1000)),
  ADD CONSTRAINT products_height_cm_valid
    CHECK (height_cm IS NULL OR (height_cm > 0 AND height_cm <= 300)),
  ADD CONSTRAINT products_width_cm_valid
    CHECK (width_cm IS NULL OR (width_cm > 0 AND width_cm <= 300)),
  ADD CONSTRAINT products_length_cm_valid
    CHECK (length_cm IS NULL OR (length_cm > 0 AND length_cm <= 300));

ALTER TABLE public.addresses
  ADD COLUMN postal_code text;

ALTER TABLE public.addresses
  ADD CONSTRAINT addresses_postal_code_valid
    CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{8}$');

CREATE TABLE public.shipping_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_postal_code text NOT NULL CHECK (destination_postal_code ~ '^[0-9]{8}$'),
  cart_fingerprint text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '20 minutes')
);

CREATE INDEX shipping_quotes_user_created_idx
  ON public.shipping_quotes (user_id, created_at DESC);

-- Tokens are private and may only be accessed through the server service role.
CREATE TABLE public.shipping_provider_tokens (
  provider text PRIMARY KEY,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_provider_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shipping_provider_tokens, public.shipping_quotes TO service_role;

CREATE TRIGGER shipping_provider_tokens_set_updated_at
BEFORE UPDATE ON public.shipping_provider_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders
  ADD COLUMN subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  ADD COLUMN shipping_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  ADD COLUMN shipping_carrier text,
  ADD COLUMN shipping_service text,
  ADD COLUMN shipping_service_id text,
  ADD COLUMN shipping_deadline integer CHECK (shipping_deadline IS NULL OR shipping_deadline >= 0),
  ADD COLUMN shipping_quote_id uuid REFERENCES public.shipping_quotes(id) ON DELETE SET NULL,
  ADD COLUMN shipping_quoted_at timestamptz,
  ADD COLUMN delivery_postal_code text,
  ADD COLUMN delivery_address jsonb,
  ADD COLUMN tracking_code text;

UPDATE public.orders
SET
  subtotal = total_amount,
  delivery_address = CASE
    WHEN shipping_address IS NULL THEN NULL
    ELSE jsonb_build_object('address', shipping_address)
  END
WHERE subtotal = 0;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_postal_code_valid
    CHECK (delivery_postal_code IS NULL OR delivery_postal_code ~ '^[0-9]{8}$'),
  ADD CONSTRAINT orders_tracking_code_length
    CHECK (tracking_code IS NULL OR char_length(tracking_code) <= 100);


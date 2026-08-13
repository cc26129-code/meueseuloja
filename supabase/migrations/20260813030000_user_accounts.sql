-- Complete customer accounts, synchronized shopping data and order ownership.
CREATE TYPE public.order_status AS ENUM (
  'awaiting_payment', 'payment_approved', 'processing', 'shipped', 'delivered', 'cancelled'
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email text NOT NULL,
  avatar_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profiles_email_unique_ci ON public.profiles (lower(email));

-- Existing administrator/customer accounts predate this migration.
INSERT INTO public.profiles (id, full_name, email)
SELECT
  id,
  trim(COALESCE(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))),
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Principal',
  address_text text NOT NULL CHECK (char_length(address_text) BETWEEN 5 AND 500),
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX addresses_one_default_per_user
  ON public.addresses (user_id) WHERE is_default;

CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE public.cart_items (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_key text NOT NULL DEFAULT 'default',
  variant jsonb NOT NULL DEFAULT '{}'::jsonb,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id, variant_key)
);

ALTER TABLE public.orders
  ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN customer_email text,
  ADD COLUMN shipping_address text,
  ADD COLUMN order_status public.order_status NOT NULL DEFAULT 'awaiting_payment';

CREATE INDEX orders_user_created_idx ON public.orders (user_id, created_at DESC);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  variant jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_payment_id text,
  method text NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);

CREATE INDEX payments_order_idx ON public.payments (order_id);

-- Preserve and normalize historical orders created before customer accounts.
UPDATE public.orders
SET order_status = CASE
  WHEN payment_status = 'paid' THEN 'payment_approved'::public.order_status
  WHEN payment_status IN ('cancelled', 'expired') THEN 'cancelled'::public.order_status
  ELSE 'awaiting_payment'::public.order_status
END;

INSERT INTO public.order_items (
  order_id, product_id, product_name, unit_price, quantity, subtotal
)
SELECT
  o.id,
  CASE
    WHEN item ->> 'product_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN (item ->> 'product_id')::uuid
    ELSE NULL
  END,
  COALESCE(item ->> 'name', 'Produto'),
  COALESCE((item ->> 'unit_price')::numeric, 0),
  GREATEST(COALESCE((item ->> 'quantity')::integer, 1), 1),
  COALESCE((item ->> 'subtotal')::numeric, 0)
FROM public.orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item;

INSERT INTO public.payments (
  order_id, provider, provider_payment_id, method, status, amount, paid_at
)
SELECT
  id, 'mercadopago', gateway_payment_id, payment_method, payment_status, total_amount, paid_at
FROM public.orders
WHERE gateway_payment_id IS NOT NULL
ON CONFLICT (provider, provider_payment_id) DO NOTHING;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER addresses_set_updated_at BEFORE UPDATE ON public.addresses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cart_items_set_updated_at BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supplied_name text;
  supplied_address text;
BEGIN
  supplied_name := trim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)));
  supplied_address := trim(COALESCE(NEW.raw_user_meta_data ->> 'address', ''));

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, supplied_name, NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  IF supplied_address <> '' THEN
    INSERT INTO public.addresses (user_id, address_text, is_default)
    VALUES (NEW.id, supplied_address, true);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_path) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT ON public.order_items, public.payments TO authenticated;
GRANT ALL ON public.profiles, public.addresses, public.favorites, public.cart_items,
  public.order_items, public.payments TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile; admins view all" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own addresses" ON public.addresses
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view addresses" ON public.addresses
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage own favorites" ON public.favorites
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own cart" ON public.cart_items
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view orders" ON public.orders;
CREATE POLICY "Users view own orders; admins view all" ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own order items; admins view all" ON public.order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users view own payments; admins view all" ON public.payments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Private avatar bucket. Only the owner may write inside their UUID folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY "Authenticated users view avatars" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users update own avatar" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users delete own avatar" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- payment_webhook_events: fail-closed, only service role (server-side) may access
REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- orders: no client-side writes; admins read only; server (service_role) handles checkout
REVOKE ALL ON public.orders FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
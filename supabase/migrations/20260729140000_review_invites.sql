-- Reseñas sin cuenta: invitación con token ligada a un cobro real.
-- Hoy /valoracion exige sesión y la petición automática solo llega por push a
-- clientas con user_id, así que quien paga en el mostrador nunca puede valorar.

CREATE TABLE IF NOT EXISTS public.review_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  -- 32 hex = 128 bits de entropía: no se adivina
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  used_at TIMESTAMPTZ,
  review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_review_invites_token ON public.review_invites(token);
CREATE INDEX IF NOT EXISTS idx_review_invites_tenant ON public.review_invites(tenant_id);

ALTER TABLE public.review_invites ENABLE ROW LEVEL SECURITY;

-- Nadie lee ni escribe esta tabla de forma anónima: el flujo público pasa por
-- la edge function `review-token`, que usa service role y valida el token.
DROP POLICY IF EXISTS "Tenant staff can create review invites" ON public.review_invites;
CREATE POLICY "Tenant staff can create review invites"
ON public.review_invites FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id()
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

DROP POLICY IF EXISTS "Tenant staff can view their review invites" ON public.review_invites;
CREATE POLICY "Tenant staff can view their review invites"
ON public.review_invites FOR SELECT
USING (
  tenant_id = get_user_tenant_id()
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

-- Datos que faltaban en reviews para mostrar quién valoró y si está verificada
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS invite_id UUID REFERENCES public.review_invites(id) ON DELETE SET NULL;

COMMENT ON TABLE public.review_invites IS 'Invitación de reseña con token, creada al cobrar. Permite valorar sin cuenta.';
COMMENT ON COLUMN public.reviews.verified IS 'true = la reseña viene de un cobro real (invitación con token)';

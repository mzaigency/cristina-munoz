
CREATE TABLE public.feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  session_id text NOT NULL,
  event_type text NOT NULL,
  section_id text NOT NULL,
  tenant_id uuid NULL,
  position integer NULL,
  score numeric NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_events_section_created ON public.feed_events(section_id, created_at DESC);
CREATE INDEX idx_feed_events_tenant_type ON public.feed_events(tenant_id, event_type);
CREATE INDEX idx_feed_events_user_created ON public.feed_events(user_id, created_at DESC);

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert valid feed events"
ON public.feed_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('impression','click','conversion')
  AND length(session_id) BETWEEN 8 AND 64
  AND length(section_id) BETWEEN 1 AND 32
  AND (position IS NULL OR (position >= 0 AND position <= 1000))
  AND ((auth.uid() IS NULL AND user_id IS NULL) OR (user_id IS NULL) OR (auth.uid() = user_id))
);

CREATE POLICY "Superadmins can view feed events"
ON public.feed_events
FOR SELECT
TO authenticated
USING (is_superadmin());

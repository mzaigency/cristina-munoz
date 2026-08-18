ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS proposal_token text,
  ADD COLUMN IF NOT EXISTS proposal_responded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_proposal_token_key
  ON public.waitlist (proposal_token) WHERE proposal_token IS NOT NULL;
-- Deduplicate push_tokens: keep only most recent row per token
DELETE FROM public.push_tokens pt
USING public.push_tokens pt2
WHERE pt.token = pt2.token
  AND pt.id <> pt2.id
  AND COALESCE(pt.updated_at, pt.created_at) < COALESCE(pt2.updated_at, pt2.created_at);

-- Ensure token uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS push_tokens_token_unique ON public.push_tokens (token);
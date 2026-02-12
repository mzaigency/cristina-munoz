
-- Function to get public reviews with reviewer profile info
CREATE OR REPLACE FUNCTION public.get_tenant_reviews(p_tenant_id uuid, p_limit integer DEFAULT 6)
RETURNS TABLE (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  reviewer_name text,
  reviewer_avatar text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    COALESCE(p.full_name, 'Cliente') as reviewer_name,
    p.avatar_url as reviewer_avatar
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.user_id
  WHERE r.tenant_id = p_tenant_id
    AND r.approved = true
  ORDER BY r.created_at DESC
  LIMIT p_limit;
$$;

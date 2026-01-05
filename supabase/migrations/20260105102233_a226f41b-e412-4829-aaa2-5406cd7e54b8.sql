-- Waitlist: allow authenticated users to join without phone, and fix RLS

-- 1) Schema changes
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Phone is optional when we can message the user inside the app
ALTER TABLE public.waitlist
  ALTER COLUMN client_phone DROP NOT NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_tenant_status ON public.waitlist (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON public.waitlist (user_id);

-- 2) Validation (server-side)
-- Require either user_id (in-app messaging) OR phone (manual contact)
CREATE OR REPLACE FUNCTION public.validate_waitlist_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalize blanks
  IF NEW.client_phone IS NOT NULL AND btrim(NEW.client_phone) = '' THEN
    NEW.client_phone := NULL;
  END IF;

  IF NEW.client_name IS NULL OR btrim(NEW.client_name) = '' THEN
    RAISE EXCEPTION 'client_name is required';
  END IF;

  IF NEW.user_id IS NULL AND NEW.client_phone IS NULL THEN
    RAISE EXCEPTION 'Either user_id or client_phone is required';
  END IF;

  -- Prevent inserting someone else's user_id
  IF NEW.user_id IS NOT NULL AND auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Cannot create waitlist entry for another user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_waitlist_contact ON public.waitlist;
CREATE TRIGGER trg_validate_waitlist_contact
BEFORE INSERT OR UPDATE ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.validate_waitlist_contact();

-- 3) RLS policies
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Staff (tenant admins / stylists) can manage waitlist for their tenant
DROP POLICY IF EXISTS "waitlist_staff_select" ON public.waitlist;
CREATE POLICY "waitlist_staff_select"
ON public.waitlist
FOR SELECT
TO authenticated
USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "waitlist_staff_insert" ON public.waitlist;
CREATE POLICY "waitlist_staff_insert"
ON public.waitlist
FOR INSERT
TO authenticated
WITH CHECK (public.user_belongs_to_tenant(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "waitlist_staff_update" ON public.waitlist;
CREATE POLICY "waitlist_staff_update"
ON public.waitlist
FOR UPDATE
TO authenticated
USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "waitlist_staff_delete" ON public.waitlist;
CREATE POLICY "waitlist_staff_delete"
ON public.waitlist
FOR DELETE
TO authenticated
USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

-- App users can create their own waitlist entries (for any active tenant)
DROP POLICY IF EXISTS "waitlist_user_insert" ON public.waitlist;
CREATE POLICY "waitlist_user_insert"
ON public.waitlist
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

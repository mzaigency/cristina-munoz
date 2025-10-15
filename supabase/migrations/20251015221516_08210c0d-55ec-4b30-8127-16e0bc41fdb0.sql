-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'stylist');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create RLS policy for user_roles (only admins can manage roles)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  user_id = auth.uid()
);

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Drop existing public policies on bookings
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- 7. Create new restricted policies for bookings
-- Only authenticated admin/stylist can view all bookings
CREATE POLICY "Admin and stylists can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'stylist')
);

-- Keep public INSERT for customer bookings
CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admin/stylist can update bookings
CREATE POLICY "Admin and stylists can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'stylist')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'stylist')
);

-- Only admin/stylist can delete bookings
CREATE POLICY "Admin and stylists can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'stylist')
);

-- 8. Create RPC function for customers to search their own bookings
CREATE OR REPLACE FUNCTION public.search_my_bookings(phone_number TEXT)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  "Telefono" TEXT,
  "Fecha" DATE,
  "Hora" TIME,
  stylist TEXT,
  services JSONB,
  google_calendar_event_id TEXT,
  calendar_id TEXT,
  is_part_of_compound BOOLEAN,
  compound_part TEXT,
  related_booking_id UUID,
  total_duration INTEGER,
  status TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Clean the input phone number (remove spaces and common separators)
  WITH cleaned_phone AS (
    SELECT regexp_replace(phone_number, '[^0-9+]', '', 'g') AS clean
  )
  SELECT 
    b.id,
    b.customer_name,
    b."Telefono",
    b."Fecha",
    b."Hora",
    b.stylist,
    b.services,
    b.google_calendar_event_id,
    b.calendar_id,
    b.is_part_of_compound,
    b.compound_part,
    b.related_booking_id,
    b.total_duration,
    b.status
  FROM public.bookings b, cleaned_phone cp
  WHERE b.status = 'confirmed'
    AND b."Fecha" >= CURRENT_DATE
    AND regexp_replace(b."Telefono", '[^0-9+]', '', 'g') LIKE '%' || cp.clean || '%'
  ORDER BY b."Fecha" ASC, b."Hora" ASC
$$;
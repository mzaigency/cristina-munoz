-- Drop and recreate get_my_bookings function with tenant info
DROP FUNCTION IF EXISTS public.get_my_bookings();

CREATE FUNCTION public.get_my_bookings()
RETURNS TABLE (
  id uuid,
  customer_name text,
  "Telefono" text,
  "Fecha" date,
  "Hora" time without time zone,
  stylist text,
  services jsonb,
  google_calendar_event_id text,
  calendar_id text,
  is_part_of_compound boolean,
  compound_part text,
  related_booking_id uuid,
  total_duration integer,
  status text,
  end_time time without time zone,
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  tenant_logo_url text,
  tenant_phone text,
  tenant_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
    b.status,
    b.end_time,
    b.tenant_id,
    t.name AS tenant_name,
    t.slug AS tenant_slug,
    t.logo_url AS tenant_logo_url,
    t.phone AS tenant_phone,
    t.address AS tenant_address
  FROM public.bookings b
  LEFT JOIN public.tenants t ON t.id = b.tenant_id
  WHERE b.user_id = auth.uid()
    AND b.status = 'confirmed'
  ORDER BY b."Fecha" ASC, b."Hora" ASC;
END;
$$;
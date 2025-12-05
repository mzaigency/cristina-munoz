-- Fix search_my_bookings to require authentication
-- Convert from SQL to PL/pgSQL to add authentication check

CREATE OR REPLACE FUNCTION public.search_my_bookings(phone_number text)
 RETURNS TABLE(id uuid, customer_name text, "Telefono" text, "Fecha" date, "Hora" time without time zone, stylist text, services jsonb, google_calendar_event_id text, calendar_id text, is_part_of_compound boolean, compound_part text, related_booking_id uuid, total_duration integer, status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cleaned_phone text;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to search bookings';
  END IF;

  -- Clean the input phone number (remove spaces and common separators)
  cleaned_phone := regexp_replace(phone_number, '[^0-9+]', '', 'g');

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
    b.status
  FROM public.bookings b
  WHERE b.status = 'confirmed'
    AND b."Fecha" >= CURRENT_DATE
    AND regexp_replace(b."Telefono", '[^0-9+]', '', 'g') LIKE '%' || cleaned_phone || '%'
  ORDER BY b."Fecha" ASC, b."Hora" ASC;
END;
$function$;
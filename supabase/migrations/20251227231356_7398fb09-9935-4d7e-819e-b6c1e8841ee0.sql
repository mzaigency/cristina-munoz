-- Añadir campos para sistema de calendario local
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8B5CF6';

-- Migrar todas las citas existentes de Google Calendar a formato local
-- Generar título a partir de los datos existentes
UPDATE public.bookings 
SET 
  title = COALESCE(customer_name, 'Sin nombre') || ' - ' || COALESCE(stylist, 'Sin estilista'),
  notes = CASE 
    WHEN google_calendar_event_id IS NOT NULL 
    THEN 'Migrado desde Google Calendar. ID original: ' || google_calendar_event_id || 
         COALESCE('. Calendar: ' || calendar_id, '')
    ELSE NULL 
  END,
  color = CASE stylist
    WHEN 'cris' THEN '#8B5CF6'
    WHEN 'desi' THEN '#D946EF'
    ELSE '#6366F1'
  END
WHERE title IS NULL;
-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Simple', 'Compuesto')),
  duration_part1_active INTEGER NOT NULL,
  duration_exposure_pause INTEGER NOT NULL DEFAULT 0,
  duration_part2_active INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read services
CREATE POLICY "Anyone can view services"
  ON public.services
  FOR SELECT
  USING (true);

-- Insert services from CSV
INSERT INTO public.services (name, type, duration_part1_active, duration_exposure_pause, duration_part2_active, category) VALUES
  ('Corte chico', 'Simple', 15, 0, 0, 'Corte'),
  ('Recogido', 'Simple', 60, 0, 0, 'Peinados y Tratamientos'),
  ('Tinte', 'Compuesto', 10, 30, 45, 'Coloración'),
  ('Mechas largas', 'Compuesto', 60, 75, 45, 'Coloración'),
  ('Mechas cortas', 'Compuesto', 15, 45, 30, 'Coloración'),
  ('Makeup', 'Simple', 60, 0, 0, 'Otros'),
  ('Peinar con bucles', 'Simple', 25, 0, 0, 'Peinados y Tratamientos'),
  ('Éclat', 'Simple', 30, 0, 0, 'Coloración'),
  ('Cejas', 'Simple', 10, 0, 0, 'Depilación Facial'),
  ('Bigote', 'Simple', 10, 0, 0, 'Depilación Facial'),
  ('Labio', 'Simple', 10, 0, 0, 'Depilación Facial'),
  ('Depilacion facial (Barbilla)', 'Simple', 10, 0, 0, 'Depilación Facial'),
  ('Hidratacion intensiva', 'Compuesto', 15, 30, 0, 'Peinados y Tratamientos'),
  ('Hidratacion intensiva con peinado', 'Compuesto', 15, 30, 20, 'Peinados y Tratamientos'),
  ('Hidratacion mantenimiento', 'Compuesto', 10, 15, 0, 'Peinados y Tratamientos'),
  ('Hidratacion mantenimiento con peinado', 'Compuesto', 10, 15, 20, 'Peinados y Tratamientos'),
  ('Lavar', 'Simple', 10, 0, 0, 'Peinados y Tratamientos'),
  ('Lavar y matizar', 'Simple', 20, 0, 0, 'Peinados y Tratamientos'),
  ('Diagnostico previo al trabajo', 'Simple', 10, 0, 0, 'Otros');

-- Create trigger for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_updated_at();

-- Add columns to bookings table for compound services
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS is_part_of_compound BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS compound_part TEXT CHECK (compound_part IN ('part1', 'part2', NULL)),
  ADD COLUMN IF NOT EXISTS related_booking_id UUID REFERENCES public.bookings(id);
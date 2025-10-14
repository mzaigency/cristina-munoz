-- Create bookings table for storing appointments
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  stylist TEXT NOT NULL CHECK (stylist IN ('cris', 'desi', 'any')),
  services JSONB NOT NULL,
  total_duration INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  google_calendar_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert bookings (public booking system)
CREATE POLICY "Anyone can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow reading all bookings (for checking availability)
CREATE POLICY "Anyone can view bookings"
  ON public.bookings
  FOR SELECT
  USING (true);

-- Create index for faster date/time queries
CREATE INDEX idx_bookings_date_time ON public.bookings(booking_date, booking_time);
CREATE INDEX idx_bookings_stylist ON public.bookings(stylist);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_booking_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_updated_at();
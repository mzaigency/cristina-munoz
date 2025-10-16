-- Create profiles table (usuarios)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (only admins can view all profiles)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Add user_id to bookings table (nullable to allow anonymous bookings)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Update bookings RLS policies to allow users to view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'stylist')
  );

-- Allow users to update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'stylist')
  );

-- Create trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.phone
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's bookings
CREATE OR REPLACE FUNCTION public.get_my_bookings()
RETURNS TABLE(
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
  status TEXT,
  end_time TIME
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    b.end_time
  FROM public.bookings b
  WHERE b.user_id = auth.uid()
    AND b.status = 'confirmed'
    AND b."Fecha" >= CURRENT_DATE
  ORDER BY b."Fecha" ASC, b."Hora" ASC
$$;
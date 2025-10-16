-- Fix security issue: Add INSERT policy for profiles table
-- This allows authenticated users to create only their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix security issue: Require authentication for booking creation
-- This prevents anonymous data harvesting attacks
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Authenticated users can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
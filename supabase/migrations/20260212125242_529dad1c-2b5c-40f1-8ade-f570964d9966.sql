
-- Allow anyone to view approved reviews (public-facing)
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (approved = true);

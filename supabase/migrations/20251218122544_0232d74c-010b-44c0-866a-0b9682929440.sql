-- Drop the existing foreign key constraint
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_related_booking_id_fkey;

-- Re-add the foreign key with ON DELETE SET NULL so related bookings can be deleted
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_related_booking_id_fkey 
FOREIGN KEY (related_booking_id) 
REFERENCES public.bookings(id) 
ON DELETE SET NULL;
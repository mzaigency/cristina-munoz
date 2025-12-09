-- Remove booking_id column and its foreign key from transactions table
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_booking_id_fkey;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS booking_id;
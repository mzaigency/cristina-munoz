-- Rename customer_phone column to Telefono in bookings table
ALTER TABLE public.bookings 
RENAME COLUMN customer_phone TO "Telefono";
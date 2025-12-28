-- Add canal (channel) column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS canal text DEFAULT 'web';

-- Add check constraint for valid values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_canal_check 
CHECK (canal IN ('whatsapp', 'web', 'crm'));
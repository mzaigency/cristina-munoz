-- Add booking_id to transactions table to link payments to appointments
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.booking_id IS 'Links transaction to the original booking for traceability';
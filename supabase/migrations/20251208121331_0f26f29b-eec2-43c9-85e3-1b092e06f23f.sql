-- Add price column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Create transactions table for payment records
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  stylist TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  services JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  voided BOOLEAN DEFAULT FALSE,
  voided_at TIMESTAMPTZ,
  voided_by UUID
);

-- Create cash_register table for daily closings
CREATE TABLE public.cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  opening_balance DECIMAL(10,2) DEFAULT 0,
  cash_total DECIMAL(10,2) DEFAULT 0,
  card_total DECIMAL(10,2) DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  cris_total DECIMAL(10,2) DEFAULT 0,
  desi_total DECIMAL(10,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Admins and stylists can view transactions"
ON public.transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role));

CREATE POLICY "Admins and stylists can create transactions"
ON public.transactions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role));

CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete transactions"
ON public.transactions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on cash_register
ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

-- RLS policies for cash_register
CREATE POLICY "Admins and stylists can view cash register"
ON public.cash_register FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'stylist'::app_role));

CREATE POLICY "Admins can manage cash register"
ON public.cash_register FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cash register"
ON public.cash_register FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cash register"
ON public.cash_register FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
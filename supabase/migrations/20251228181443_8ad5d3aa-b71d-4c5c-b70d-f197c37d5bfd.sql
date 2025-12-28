-- Añadir campos nuevos a la tabla transactions para Fases 1 y 2
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS stylist_id UUID REFERENCES public.tenant_stylists(id),
ADD COLUMN IF NOT EXISTS tip_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', NULL)),
ADD COLUMN IF NOT EXISTS discount_reason TEXT,
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';

-- Añadir comentarios descriptivos
COMMENT ON COLUMN public.transactions.stylist_id IS 'Referencia al estilista que realizó el servicio';
COMMENT ON COLUMN public.transactions.tip_amount IS 'Propina opcional del cliente';
COMMENT ON COLUMN public.transactions.discount_type IS 'Tipo de descuento: percentage o fixed';
COMMENT ON COLUMN public.transactions.discount_reason IS 'Motivo del descuento aplicado';
COMMENT ON COLUMN public.transactions.payment_details IS 'Detalles del pago: {cash_amount, card_amount} para pagos mixtos';
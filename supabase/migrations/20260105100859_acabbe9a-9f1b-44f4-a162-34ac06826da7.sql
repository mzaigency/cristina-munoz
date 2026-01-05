-- Add is_blocked field to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_clients_is_blocked ON public.clients(tenant_id, is_blocked);

-- Add comment explaining the field
COMMENT ON COLUMN public.clients.is_blocked IS 'When true, client is blocked and should not appear in client lists';
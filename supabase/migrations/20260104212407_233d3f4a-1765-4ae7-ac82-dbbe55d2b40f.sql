-- =============================================
-- PHASE 2 COMPLETE: All remaining features
-- =============================================

-- 1. Add favorite_stylist_id to clients if not exists (for preferences)
-- Already exists from previous migration

-- 2. Add preferred_services to clients for habitual services
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_services uuid[] DEFAULT '{}';

-- 3. Create promotions/coupons table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT, -- promotional code (nullable for auto-apply promos)
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  max_uses INTEGER, -- null = unlimited
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all', -- 'all', 'services', 'products'
  loyalty_points_required INTEGER DEFAULT 0, -- for loyalty discounts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true AND is_tenant_active(tenant_id));

CREATE POLICY "Tenant staff can manage promotions" ON public.promotions
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')))
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "SuperAdmin can manage all promotions" ON public.promotions
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- 4. Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  preferred_stylist_id UUID REFERENCES public.tenant_stylists(id),
  services JSONB DEFAULT '[]',
  priority INTEGER DEFAULT 0, -- higher = more priority
  status TEXT DEFAULT 'waiting', -- 'waiting', 'notified', 'booked', 'expired'
  notified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant staff can manage waitlist" ON public.waitlist
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')))
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "SuperAdmin can manage all waitlist" ON public.waitlist
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- 5. Create monthly goals table
CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  revenue_goal NUMERIC DEFAULT 0,
  bookings_goal INTEGER DEFAULT 0,
  new_clients_goal INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, month, year)
);

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can manage goals" ON public.monthly_goals
  FOR ALL USING (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "SuperAdmin can manage all goals" ON public.monthly_goals
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- 6. Create stylist commissions table (if not exists)
CREATE TABLE IF NOT EXISTS public.stylist_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES public.tenant_stylists(id) ON DELETE CASCADE,
  commission_percentage NUMERIC DEFAULT 0,
  commission_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed', 'mixed'
  commission_fixed NUMERIC DEFAULT 0,
  effective_from DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add commission_type and commission_fixed if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stylist_commissions' AND column_name = 'commission_type') THEN
    ALTER TABLE public.stylist_commissions ADD COLUMN commission_type TEXT DEFAULT 'percentage';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stylist_commissions' AND column_name = 'commission_fixed') THEN
    ALTER TABLE public.stylist_commissions ADD COLUMN commission_fixed NUMERIC DEFAULT 0;
  END IF;
END $$;

ALTER TABLE public.stylist_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant admins can manage commissions" ON public.stylist_commissions;
CREATE POLICY "Tenant admins can manage commissions" ON public.stylist_commissions
  FOR ALL USING (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "SuperAdmin can manage all commissions" ON public.stylist_commissions;
CREATE POLICY "SuperAdmin can manage all commissions" ON public.stylist_commissions
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- 7. Create service packages table
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  services JSONB NOT NULL DEFAULT '[]', -- array of {service_id, name, original_price}
  original_total NUMERIC NOT NULL DEFAULT 0,
  package_price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON public.service_packages
  FOR SELECT USING (is_active = true AND is_tenant_active(tenant_id));

CREATE POLICY "Tenant staff can manage packages" ON public.service_packages
  FOR ALL USING (tenant_id = get_user_tenant_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist')))
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "SuperAdmin can manage all packages" ON public.service_packages
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- 8. Add loyalty_points to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;
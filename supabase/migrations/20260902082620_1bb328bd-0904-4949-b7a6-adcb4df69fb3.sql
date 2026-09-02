
-- cash_register
DROP POLICY IF EXISTS "Tenant admins can manage their cash register" ON public.cash_register;
CREATE POLICY "Tenant admins can manage their cash register"
ON public.cash_register FOR ALL TO authenticated
USING (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id))
WITH CHECK (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id));

-- products
DROP POLICY IF EXISTS "Tenant admins can manage their products" ON public.products;
CREATE POLICY "Tenant admins can manage their products"
ON public.products FOR ALL TO authenticated
USING (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id))
WITH CHECK (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id));

-- stylist_commissions
DROP POLICY IF EXISTS "Tenant admins can manage commissions" ON public.stylist_commissions;
CREATE POLICY "Tenant admins can manage commissions"
ON public.stylist_commissions FOR ALL TO authenticated
USING (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id))
WITH CHECK (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id));

DROP POLICY IF EXISTS "Tenant admins can view commissions" ON public.stylist_commissions;
CREATE POLICY "Tenant admins can view commissions"
ON public.stylist_commissions FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id));

-- transactions
DROP POLICY IF EXISTS "Tenant admins can delete transactions" ON public.transactions;
CREATE POLICY "Tenant admins can delete transactions"
ON public.transactions FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id));

DROP POLICY IF EXISTS "Tenant admins can update transactions" ON public.transactions;
CREATE POLICY "Tenant admins can update transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id))
WITH CHECK (tenant_id = get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'::app_role, tenant_id));

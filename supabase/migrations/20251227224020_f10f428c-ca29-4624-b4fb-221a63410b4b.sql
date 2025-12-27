-- =============================================
-- FASE 4B: ACTUALIZAR RLS PARA OTRAS TABLAS
-- =============================================

-- 4. Actualizar políticas de cash_register
DROP POLICY IF EXISTS "Admins and stylists can view cash register" ON public.cash_register;
DROP POLICY IF EXISTS "Admins can manage cash register" ON public.cash_register;
DROP POLICY IF EXISTS "Admins can update cash register" ON public.cash_register;
DROP POLICY IF EXISTS "Admins can delete cash register" ON public.cash_register;

CREATE POLICY "SuperAdmin can manage all cash registers"
ON public.cash_register FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant staff can view their cash register"
ON public.cash_register FOR SELECT
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Tenant admins can manage their cash register"
ON public.cash_register FOR ALL
USING (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin')
);

-- 5. Actualizar políticas de transactions
DROP POLICY IF EXISTS "Admins and stylists can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins and stylists can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;

CREATE POLICY "SuperAdmin can manage all transactions"
ON public.transactions FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant staff can view their transactions"
ON public.transactions FOR SELECT
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Tenant staff can create transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Tenant admins can update transactions"
ON public.transactions FOR UPDATE
USING (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Tenant admins can delete transactions"
ON public.transactions FOR DELETE
USING (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin')
);

-- 6. Actualizar políticas de whatsapp_contacts
DROP POLICY IF EXISTS "Admin and stylists can view contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Admins and stylists can update whatsapp_contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Admins and stylists can delete contacts" ON public.whatsapp_contacts;

CREATE POLICY "SuperAdmin can manage all whatsapp contacts"
ON public.whatsapp_contacts FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant staff can view their whatsapp contacts"
ON public.whatsapp_contacts FOR SELECT
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Tenant staff can update their whatsapp contacts"
ON public.whatsapp_contacts FOR UPDATE
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
)
WITH CHECK (
  tenant_id = get_user_tenant_id()
);

CREATE POLICY "Tenant staff can delete their whatsapp contacts"
ON public.whatsapp_contacts FOR DELETE
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

-- 7. Actualizar políticas de whatsapp_messages
DROP POLICY IF EXISTS "Admin and stylists can view messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins and stylists can delete messages" ON public.whatsapp_messages;

CREATE POLICY "SuperAdmin can manage all whatsapp messages"
ON public.whatsapp_messages FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Tenant staff can view their whatsapp messages"
ON public.whatsapp_messages FOR SELECT
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);

CREATE POLICY "Tenant staff can delete their whatsapp messages"
ON public.whatsapp_messages FOR DELETE
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'stylist'))
);
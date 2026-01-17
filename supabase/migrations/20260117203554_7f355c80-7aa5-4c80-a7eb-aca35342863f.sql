-- Limpiar planes existentes e insertar los 3 nuevos planes
DELETE FROM subscription_plans;

INSERT INTO subscription_plans (name, slug, monthly_price, annual_price, max_stylists, max_services, features, sort_order, is_active)
VALUES 
  ('Starter', 'starter', 29, 290, 1, 15, 
   '{"stories": true, "messages": true, "cash_register": false, "commissions": false, "advanced_analytics": false, "pdf_reports": false, "promotions": false, "packages": false, "monthly_goals": false, "waitlist": false}'::jsonb, 
   1, true),
  ('Pro', 'pro', 49, 490, 3, 50, 
   '{"stories": true, "messages": true, "cash_register": true, "commissions": false, "advanced_analytics": true, "pdf_reports": true, "promotions": true, "packages": true, "monthly_goals": false, "waitlist": false}'::jsonb, 
   2, true),
  ('Business', 'business', 89, 890, 999, 999, 
   '{"stories": true, "messages": true, "cash_register": true, "commissions": true, "advanced_analytics": true, "pdf_reports": true, "promotions": true, "packages": true, "monthly_goals": true, "waitlist": true}'::jsonb, 
   3, true);

-- Actualizar tenants existentes que no tengan plan definido
UPDATE tenants 
SET subscription_plan = 'starter' 
WHERE subscription_plan IS NULL OR subscription_plan = '';
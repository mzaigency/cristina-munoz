UPDATE public.tenants
SET subscription_expires_at = '2026-09-04T11:33:53+00:00',
    subscription_plan = 'pro',
    is_active = true,
    updated_at = now()
WHERE slug = 'montserratfaig';
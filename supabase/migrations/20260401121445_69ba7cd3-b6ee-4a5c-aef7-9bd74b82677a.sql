UPDATE public.clients c
SET user_id = p.id
FROM public.profiles p
WHERE c.user_id IS NULL
  AND (
    (c.email IS NOT NULL AND c.email != '' AND lower(trim(c.email)) = lower(trim(p.email)))
    OR
    (c.phone IS NOT NULL AND c.phone != '' AND p.phone IS NOT NULL AND p.phone != '' AND replace(c.phone, ' ', '') = replace(p.phone, ' ', ''))
  );
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_author_present
  CHECK (user_id IS NOT NULL OR invite_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.validate_review_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_count integer;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO recent_count
  FROM public.reviews
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF recent_count > 0 THEN
    RAISE EXCEPTION 'Solo puedes dejar una reseña cada 24 horas'
      USING HINT = 'Por favor, espera antes de enviar otra reseña';
  END IF;

  RETURN NEW;
END;
$function$;
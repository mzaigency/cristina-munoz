ALTER TABLE public.bookings
  ALTER COLUMN reminder_sent TYPE text
  USING CASE WHEN reminder_sent IS NOT NULL THEN reminder_sent::text ELSE NULL END;
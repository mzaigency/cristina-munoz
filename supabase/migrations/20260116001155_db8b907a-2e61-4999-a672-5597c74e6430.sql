-- User notification preferences table
-- Stores which notifications each user wants to receive

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- User notifications
  messages BOOLEAN DEFAULT true,
  reminder_24h BOOLEAN DEFAULT true,
  reminder_2h BOOLEAN DEFAULT true,
  review_request BOOLEAN DEFAULT true,
  booking_confirmed BOOLEAN DEFAULT true,
  booking_cancelled BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  
  -- Admin notifications (for salon owners)
  new_booking BOOLEAN DEFAULT true,
  client_cancellation BOOLEAN DEFAULT true,
  new_review BOOLEAN DEFAULT true,
  client_messages BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get or create preferences with defaults
CREATE OR REPLACE FUNCTION public.get_notification_preferences(p_user_id UUID)
RETURNS public.user_notification_preferences AS $$
DECLARE
  result public.user_notification_preferences;
BEGIN
  SELECT * INTO result FROM public.user_notification_preferences WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_timestamp();
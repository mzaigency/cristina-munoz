-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Booking notifications
  new_booking BOOLEAN DEFAULT true,
  booking_cancelled BOOLEAN DEFAULT true,
  booking_reminder_1h BOOLEAN DEFAULT true,
  booking_reminder_24h BOOLEAN DEFAULT false,
  
  -- Message notifications  
  new_message BOOLEAN DEFAULT true,
  
  -- Review notifications
  new_review BOOLEAN DEFAULT true,
  
  -- Daily summary
  daily_summary BOOLEAN DEFAULT false,
  daily_summary_time TEXT DEFAULT '08:00',
  
  -- Push notifications enabled
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX idx_notification_prefs_user ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_prefs_tenant ON public.notification_preferences(tenant_id);

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
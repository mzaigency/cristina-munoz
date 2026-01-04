-- Create table for story widgets
CREATE TABLE public.story_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.salon_stories(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('poll', 'question', 'emoji_slider')),
  config JSONB NOT NULL DEFAULT '{}',
  position_x REAL NOT NULL DEFAULT 50,
  position_y REAL NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for widget responses
CREATE TABLE public.story_widget_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID NOT NULL REFERENCES public.story_widgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(widget_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_widget_responses ENABLE ROW LEVEL SECURITY;

-- Policies for story_widgets (public read, tenant admin write)
CREATE POLICY "Anyone can view story widgets"
ON public.story_widgets FOR SELECT
USING (true);

CREATE POLICY "Tenant admins can manage widgets"
ON public.story_widgets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.salon_stories ss
    JOIN public.tenant_admins ta ON ss.tenant_id = ta.tenant_id
    WHERE ss.id = story_widgets.story_id AND ta.user_id = auth.uid()
  )
);

-- Policies for responses (users can create/read their own)
CREATE POLICY "Users can view all responses"
ON public.story_widget_responses FOR SELECT
USING (true);

CREATE POLICY "Users can create their own responses"
ON public.story_widget_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
ON public.story_widget_responses FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_widget_responses;
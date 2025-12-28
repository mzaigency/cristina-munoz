-- Drop the old constraint and create a new one with story_reply added
ALTER TABLE public.direct_messages 
DROP CONSTRAINT direct_messages_message_type_check;

ALTER TABLE public.direct_messages 
ADD CONSTRAINT direct_messages_message_type_check 
CHECK (message_type = ANY (ARRAY['text'::text, 'booking_confirmation'::text, 'booking_reminder'::text, 'booking_cancelled'::text, 'booking_cancellation'::text, 'review_request'::text, 'story_reply'::text]));
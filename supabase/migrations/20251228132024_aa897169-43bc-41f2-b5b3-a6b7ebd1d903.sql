-- Drop existing constraint and add updated one with all message types
ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_message_type_check;

ALTER TABLE direct_messages ADD CONSTRAINT direct_messages_message_type_check 
CHECK (message_type = ANY (ARRAY['text'::text, 'booking_confirmation'::text, 'booking_reminder'::text, 'booking_cancelled'::text, 'booking_cancellation'::text, 'review_request'::text]));
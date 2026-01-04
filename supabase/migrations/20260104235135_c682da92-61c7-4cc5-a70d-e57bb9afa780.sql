-- Fix RLS policy for story_views INSERT
-- The current policy only has WITH CHECK but no USING expression
-- We need to ensure authenticated users can insert their own views

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can record their views" ON public.story_views;

-- Create new INSERT policy with proper permissions
CREATE POLICY "Users can record their views" 
ON public.story_views 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also add a policy to allow the SELECT that happens during INSERT (for conflict resolution)
CREATE POLICY "Users can check their own views for upsert" 
ON public.story_views 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
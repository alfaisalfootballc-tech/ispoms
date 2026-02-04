-- Fix the overly permissive INSERT policy on chat_conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
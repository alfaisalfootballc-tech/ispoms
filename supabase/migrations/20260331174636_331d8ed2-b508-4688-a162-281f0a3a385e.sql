
-- Drop and recreate the SELECT policy for chat_conversations
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.chat_conversations;
CREATE POLICY "Participants can view their conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (true);

-- Drop old and create new INSERT policy for chat_conversation_participants
DROP POLICY IF EXISTS "Users can add themselves or be added to conversations" ON public.chat_conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.chat_conversation_participants;
CREATE POLICY "Users can add participants to conversations"
ON public.chat_conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

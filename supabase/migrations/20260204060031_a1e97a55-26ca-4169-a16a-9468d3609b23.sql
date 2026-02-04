-- Create chat channels table for group/department chats
CREATE TABLE public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'department')),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create channel members table
CREATE TABLE public.chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Create direct message conversations table
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.chat_conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table (works for both channels and DMs)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT message_target CHECK (
    (channel_id IS NOT NULL AND conversation_id IS NULL) OR
    (channel_id IS NULL AND conversation_id IS NOT NULL)
  )
);

-- Enable RLS on all tables
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create helper function to check channel membership
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = _channel_id AND c.type = 'public'
  ) OR public.is_admin()
$$;

-- Create helper function to check conversation participation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  ) OR public.is_admin()
$$;

-- RLS Policies for chat_channels
CREATE POLICY "Users can view public channels or channels they're members of"
ON public.chat_channels FOR SELECT
USING (type = 'public' OR is_channel_member(id, auth.uid()) OR is_admin());

CREATE POLICY "Authenticated users can create channels"
ON public.chat_channels FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Channel creators and admins can update channels"
ON public.chat_channels FOR UPDATE
USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Channel creators and admins can delete channels"
ON public.chat_channels FOR DELETE
USING (created_by = auth.uid() OR is_admin());

-- RLS Policies for chat_channel_members
CREATE POLICY "Members can view channel membership"
ON public.chat_channel_members FOR SELECT
USING (is_channel_member(channel_id, auth.uid()));

CREATE POLICY "Users can join public channels or be added by admins"
ON public.chat_channel_members FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR 
  is_admin() OR
  EXISTS (SELECT 1 FROM chat_channels WHERE id = channel_id AND created_by = auth.uid())
);

CREATE POLICY "Users can leave channels or admins can remove"
ON public.chat_channel_members FOR DELETE
USING (user_id = auth.uid() OR is_admin());

-- RLS Policies for chat_conversations
CREATE POLICY "Participants can view their conversations"
ON public.chat_conversations FOR SELECT
USING (is_conversation_participant(id, auth.uid()));

CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (true);

-- RLS Policies for chat_conversation_participants
CREATE POLICY "Participants can view conversation participants"
ON public.chat_conversation_participants FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can add themselves or be added to conversations"
ON public.chat_conversation_participants FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_admin());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their channels/conversations"
ON public.chat_messages FOR SELECT
USING (
  (channel_id IS NOT NULL AND is_channel_member(channel_id, auth.uid())) OR
  (conversation_id IS NOT NULL AND is_conversation_participant(conversation_id, auth.uid()))
);

CREATE POLICY "Users can send messages to their channels/conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND (
    (channel_id IS NOT NULL AND is_channel_member(channel_id, auth.uid())) OR
    (conversation_id IS NOT NULL AND is_conversation_participant(conversation_id, auth.uid()))
  )
);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages or admins can delete any"
ON public.chat_messages FOR DELETE
USING (sender_id = auth.uid() OR is_admin());

-- Add updated_at triggers
CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
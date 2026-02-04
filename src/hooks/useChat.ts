import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ChatChannel {
  id: string;
  name: string;
  description: string | null;
  type: "public" | "private" | "department";
  department_id: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface ChatConversation {
  id: string;
  created_at: string;
  participants: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  }[];
  last_message?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  channel_id: string | null;
  conversation_id: string | null;
  reply_to_id: string | null;
  created_at: string;
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reply_to?: ChatMessage;
}

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching channels:", error);
      return;
    }

    setChannels((data || []) as ChatChannel[]);
  }, [user]);

  // Fetch conversations (DMs)
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: participantData, error: participantError } = await supabase
      .from("chat_conversation_participants")
      .select(`
        conversation_id,
        chat_conversations (
          id,
          created_at
        )
      `)
      .eq("user_id", user.id);

    if (participantError) {
      console.error("Error fetching conversations:", participantError);
      return;
    }

    const conversationIds = participantData?.map(p => p.conversation_id) || [];
    
    if (conversationIds.length === 0) {
      setConversations([]);
      return;
    }

    // Get all participants for these conversations
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from("chat_conversation_participants")
      .select(`
        conversation_id,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .in("conversation_id", conversationIds);

    if (allParticipantsError) {
      console.error("Error fetching participants:", allParticipantsError);
      return;
    }

    // Group participants by conversation
    const conversationsWithParticipants: ChatConversation[] = conversationIds.map(convId => {
      const convData = participantData?.find(p => p.conversation_id === convId)?.chat_conversations;
      const participants = allParticipants
        ?.filter(p => p.conversation_id === convId)
        .map(p => p.profiles as unknown as ChatConversation["participants"][0])
        .filter(p => p.id !== user.id) || [];

      return {
        id: convId,
        created_at: convData?.created_at || "",
        participants,
      };
    });

    setConversations(conversationsWithParticipants);
  }, [user]);

  // Fetch messages for a channel or conversation
  const fetchMessages = useCallback(async (channelId: string | null, conversationId: string | null) => {
    if (!user || (!channelId && !conversationId)) return;

    setIsLoading(true);
    
    let query = supabase
      .from("chat_messages")
      .select(`
        *,
        sender:sender_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .order("created_at", { ascending: true });

    if (channelId) {
      query = query.eq("channel_id", channelId);
    } else if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      setIsLoading(false);
      return;
    }

    setMessages(data as ChatMessage[] || []);
    setIsLoading(false);
  }, [user]);

  // Send a message
  const sendMessage = async (content: string, channelId: string | null, conversationId: string | null) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        content: content.trim(),
        sender_id: user.id,
        channel_id: channelId,
        conversation_id: conversationId,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message,
      });
      return false;
    }

    return true;
  };

  // Create a channel
  const createChannel = async (name: string, description: string, type: "public" | "private" | "department") => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("chat_channels")
      .insert({
        name,
        description,
        type,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to create channel",
        description: error.message,
      });
      return null;
    }

    // Add creator as member
    await supabase
      .from("chat_channel_members")
      .insert({
        channel_id: data.id,
        user_id: user.id,
      });

    toast({
      title: "Channel created",
      description: `#${name} has been created successfully.`,
    });

    fetchChannels();
    return data as ChatChannel;
  };

  // Start a conversation with a user
  const startConversation = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return null;

    // Check if conversation already exists
    const { data: existingConvs } = await supabase
      .from("chat_conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (existingConvs) {
      for (const conv of existingConvs) {
        const { data: otherParticipant } = await supabase
          .from("chat_conversation_participants")
          .select("user_id")
          .eq("conversation_id", conv.conversation_id)
          .eq("user_id", targetUserId)
          .single();

        if (otherParticipant) {
          // Conversation already exists
          setActiveConversation(conv.conversation_id);
          setActiveChannel(null);
          return conv.conversation_id;
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from("chat_conversations")
      .insert({})
      .select()
      .single();

    if (convError) {
      toast({
        variant: "destructive",
        title: "Failed to start conversation",
        description: convError.message,
      });
      return null;
    }

    // Add both participants
    const { error: participantError } = await supabase
      .from("chat_conversation_participants")
      .insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: targetUserId },
      ]);

    if (participantError) {
      console.error("Error adding participants:", participantError);
    }

    fetchConversations();
    setActiveConversation(newConv.id);
    setActiveChannel(null);
    return newConv.id;
  };

  // Join a channel
  const joinChannel = async (channelId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("chat_channel_members")
      .insert({
        channel_id: channelId,
        user_id: user.id,
      });

    if (error && !error.message.includes("duplicate")) {
      toast({
        variant: "destructive",
        title: "Failed to join channel",
        description: error.message,
      });
    }
  };

  // Set active channel
  const selectChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setActiveConversation(null);
    fetchMessages(channelId, null);
    joinChannel(channelId);
  };

  // Set active conversation
  const selectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    setActiveChannel(null);
    fetchMessages(null, conversationId);
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Only add if it's for the active channel/conversation
          if (
            (activeChannel && newMessage.channel_id === activeChannel) ||
            (activeConversation && newMessage.conversation_id === activeConversation)
          ) {
            // Fetch the sender info
            supabase
              .from("profiles")
              .select("id, first_name, last_name, email, avatar_url")
              .eq("id", newMessage.sender_id)
              .single()
              .then(({ data: sender }) => {
                setMessages((prev) => [
                  ...prev,
                  { ...newMessage, sender: sender || undefined },
                ]);
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChannel, activeConversation]);

  // Initial fetch
  useEffect(() => {
    fetchChannels();
    fetchConversations();
  }, [fetchChannels, fetchConversations]);

  return {
    channels,
    conversations,
    messages,
    isLoading,
    activeChannel,
    activeConversation,
    sendMessage,
    createChannel,
    startConversation,
    selectChannel,
    selectConversation,
    fetchChannels,
    fetchConversations,
  };
}

import { useState } from "react";
import { Hash, MessageCircle, Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatChannel, ChatConversation } from "@/hooks/useChat";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { NewConversationDialog } from "./NewConversationDialog";

interface ChatSidebarProps {
  channels: ChatChannel[];
  conversations: ChatConversation[];
  activeChannel: string | null;
  activeConversation: string | null;
  onSelectChannel: (channelId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateChannel: (name: string, description: string, type: "public" | "private" | "department") => Promise<ChatChannel | null>;
  onStartConversation: (userId: string) => Promise<string | null>;
}

export function ChatSidebar({
  channels,
  conversations,
  activeChannel,
  activeConversation,
  onSelectChannel,
  onSelectConversation,
  onCreateChannel,
  onStartConversation,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConversations = conversations.filter((conv) =>
    conv.participants.some(
      (p) =>
        p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    )
  );

  const getParticipantName = (conv: ChatConversation) => {
    const participant = conv.participants[0];
    if (!participant) return "Unknown";
    if (participant.first_name && participant.last_name) {
      return `${participant.first_name} ${participant.last_name}`;
    }
    return participant.email.split("@")[0];
  };

  const getParticipantInitials = (conv: ChatConversation) => {
    const participant = conv.participants[0];
    if (!participant) return "?";
    if (participant.first_name && participant.last_name) {
      return `${participant.first_name[0]}${participant.last_name[0]}`.toUpperCase();
    }
    return participant.email[0].toUpperCase();
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Channels Section */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Hash className="w-3.5 h-3.5" />
              Channels
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setShowCreateChannel(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-0.5">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  activeChannel === channel.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}

            {filteredChannels.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                No channels found
              </p>
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="p-3 pt-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" />
              Direct Messages
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setShowNewConversation(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-0.5">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  activeConversation === conv.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={conv.participants[0]?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getParticipantInitials(conv)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{getParticipantName(conv)}</span>
              </button>
            ))}

            {filteredConversations.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                No conversations yet
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onCreateChannel={onCreateChannel}
      />

      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        onStartConversation={onStartConversation}
      />
    </div>
  );
}

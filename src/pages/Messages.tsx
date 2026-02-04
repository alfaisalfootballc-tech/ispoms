import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { Hash, MessageCircle } from "lucide-react";

export default function Messages() {
  const {
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
  } = useChat();

  const handleSendMessage = async (content: string) => {
    return sendMessage(content, activeChannel, activeConversation);
  };

  const getActiveTitle = () => {
    if (activeChannel) {
      const channel = channels.find((c) => c.id === activeChannel);
      return channel ? `#${channel.name}` : "Channel";
    }
    if (activeConversation) {
      const conv = conversations.find((c) => c.id === activeConversation);
      if (conv?.participants[0]) {
        const p = conv.participants[0];
        if (p.first_name && p.last_name) {
          return `${p.first_name} ${p.last_name}`;
        }
        return p.email.split("@")[0];
      }
      return "Direct Message";
    }
    return null;
  };

  const activeTitle = getActiveTitle();

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        <ChatSidebar
          channels={channels}
          conversations={conversations}
          activeChannel={activeChannel}
          activeConversation={activeConversation}
          onSelectChannel={selectChannel}
          onSelectConversation={selectConversation}
          onCreateChannel={createChannel}
          onStartConversation={startConversation}
        />

        <div className="flex-1 flex flex-col">
          {activeTitle ? (
            <>
              {/* Chat Header */}
              <div className="h-14 border-b border-border px-4 flex items-center gap-3">
                {activeChannel ? (
                  <Hash className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                )}
                <h2 className="font-semibold">{activeTitle}</h2>
                {activeChannel && (
                  <span className="text-sm text-muted-foreground">
                    {channels.find((c) => c.id === activeChannel)?.description}
                  </span>
                )}
              </div>

              {/* Messages Area */}
              <ChatMessages messages={messages} isLoading={isLoading} />

              {/* Message Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                placeholder={`Message ${activeTitle}`}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">Welcome to Messages</h3>
                <p className="text-sm">
                  Select a channel or start a conversation to begin chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

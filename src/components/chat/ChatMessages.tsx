import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, h:mm a");
  };

  const getSenderName = (message: ChatMessage) => {
    if (message.sender?.first_name && message.sender?.last_name) {
      return `${message.sender.first_name} ${message.sender.last_name}`;
    }
    return message.sender?.email?.split("@")[0] || "Unknown";
  };

  const getInitials = (message: ChatMessage) => {
    if (message.sender?.first_name && message.sender?.last_name) {
      return `${message.sender.first_name[0]}${message.sender.last_name[0]}`.toUpperCase();
    }
    return message.sender?.email?.[0].toUpperCase() || "?";
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = "";

  messages.forEach((message) => {
    const messageDate = format(new Date(message.created_at), "yyyy-MM-dd");
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({
        date: messageDate,
        messages: [message],
      });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium text-muted-foreground">
                {formatGroupDate(group.date)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {group.messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showAvatar =
                  index === 0 ||
                  group.messages[index - 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      isOwn && "flex-row-reverse"
                    )}
                  >
                    {showAvatar ? (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.sender?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(message)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    <div
                      className={cn(
                        "max-w-[70%]",
                        isOwn && "text-right"
                      )}
                    >
                      {showAvatar && (
                        <div
                          className={cn(
                            "flex items-center gap-2 mb-1",
                            isOwn && "flex-row-reverse"
                          )}
                        >
                          <span className="text-sm font-medium">
                            {isOwn ? "You" : getSenderName(message)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageDate(message.created_at)}
                          </span>
                        </div>
                      )}

                      <div
                        className={cn(
                          "inline-block px-3 py-2 rounded-lg",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}

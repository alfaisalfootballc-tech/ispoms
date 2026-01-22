import { useEffect } from "react";
import { format } from "date-fns";
import { X, Pin, Clock, Users, Building2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Announcement, useAnnouncements } from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";

interface ViewAnnouncementDialogProps {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "text-destructive border-destructive";
    case "high":
      return "text-amber-500 border-amber-500";
    case "normal":
      return "text-primary border-primary";
    default:
      return "text-muted-foreground border-muted-foreground";
  }
};

// Simple markdown-like rendering
const renderContent = (content: string) => {
  return content
    .split("\n")
    .map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Italic
      processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
      // Links
      processed = processed.replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="text-primary underline" target="_blank">$1</a>'
      );
      // List items
      if (processed.startsWith("- ")) {
        processed = `<li class="ml-4">${processed.slice(2)}</li>`;
      }

      return (
        <p
          key={i}
          className="mb-2"
          dangerouslySetInnerHTML={{ __html: processed || "&nbsp;" }}
        />
      );
    });
};

export function ViewAnnouncementDialog({ announcement, open, onOpenChange }: ViewAnnouncementDialogProps) {
  const { markAsRead } = useAnnouncements();

  useEffect(() => {
    if (announcement && open && !announcement.is_read) {
      markAsRead.mutate(announcement.id);
    }
  }, [announcement, open]);

  if (!announcement) return null;

  const authorName = announcement.author
    ? `${announcement.author.first_name || ""} ${announcement.author.last_name || ""}`.trim() ||
      announcement.author.email
    : "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {announcement.is_pinned && (
                  <Pin className="w-4 h-4 text-primary" />
                )}
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", getPriorityColor(announcement.priority))}
                >
                  {announcement.priority}
                </Badge>
                {announcement.target_all ? (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Users className="w-3 h-3" />
                    All Staff
                  </Badge>
                ) : announcement.department ? (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Building2 className="w-3 h-3" />
                    {announcement.department.name}
                  </Badge>
                ) : null}
              </div>
              <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {authorName}
            </div>
            {announcement.published_at && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {format(new Date(announcement.published_at), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator className="mt-4" />

        <ScrollArea className="max-h-[400px]">
          <div className="p-6 pt-4 prose prose-sm max-w-none">
            {renderContent(announcement.content)}
          </div>
        </ScrollArea>

        {announcement.expires_at && (
          <>
            <Separator />
            <div className="p-4 bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              This announcement expires on {format(new Date(announcement.expires_at), "MMMM d, yyyy")}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

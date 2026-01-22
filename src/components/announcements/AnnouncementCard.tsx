import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Pin, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  Users,
  Building2,
  AlertTriangle,
  Bell,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Announcement, useAnnouncements } from "@/hooks/useAnnouncements";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: (announcement: Announcement) => void;
  onView?: (announcement: Announcement) => void;
  compact?: boolean;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "urgent":
      return { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle };
    case "high":
      return { color: "text-amber-500", bg: "bg-amber-500/10", icon: Bell };
    case "normal":
      return { color: "text-primary", bg: "bg-primary/10", icon: Bell };
    default:
      return { color: "text-muted-foreground", bg: "bg-muted", icon: Bell };
  }
};

export function AnnouncementCard({ announcement, onEdit, onView, compact = false }: AnnouncementCardProps) {
  const { user, isAdmin } = useAuth();
  const { deleteAnnouncement, markAsRead } = useAnnouncements();

  const isOwner = user?.id === announcement.created_by;
  const canEdit = isOwner || isAdmin;
  const priorityConfig = getPriorityConfig(announcement.priority);
  const PriorityIcon = priorityConfig.icon;

  const isScheduled = announcement.published_at && new Date(announcement.published_at) > new Date();
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  const authorName = announcement.author
    ? `${announcement.author.first_name || ""} ${announcement.author.last_name || ""}`.trim() ||
      announcement.author.email
    : "Unknown";

  const handleView = () => {
    if (!announcement.is_read) {
      markAsRead.mutate(announcement.id);
    }
    onView?.(announcement);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteAnnouncement.mutate(announcement.id);
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
          !announcement.is_read && "border-primary/30 bg-primary/5"
        )}
        onClick={handleView}
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", priorityConfig.bg)}>
            <PriorityIcon className={cn("w-4 h-4", priorityConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {announcement.is_pinned && <Pin className="w-3 h-3 text-primary" />}
              <h4 className="font-medium text-sm truncate">{announcement.title}</h4>
              {!announcement.is_read && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {announcement.published_at
                ? formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true })
                : "Draft"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "hover:shadow-md transition-all",
      !announcement.is_read && "border-primary/30",
      announcement.is_pinned && "border-primary/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("p-2.5 rounded-lg", priorityConfig.bg)}>
              <PriorityIcon className={cn("w-5 h-5", priorityConfig.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {announcement.is_pinned && (
                  <Pin className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                <h3 className="font-semibold text-base">{announcement.title}</h3>
                {!announcement.is_read && (
                  <Badge variant="default" className="text-[10px] h-5">New</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span>{authorName}</span>
                <span>•</span>
                {isScheduled ? (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="w-3 h-3" />
                    Scheduled for {format(new Date(announcement.published_at!), "MMM d, h:mm a")}
                  </span>
                ) : announcement.published_at ? (
                  <span>{formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true })}</span>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                )}
                {isExpired && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Expired</Badge>
                )}
              </div>
            </div>
          </div>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(announcement)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {announcement.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {announcement.excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1 text-xs capitalize">
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

          {announcement.expires_at && !isExpired && (
            <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Expires {format(new Date(announcement.expires_at), "MMM d")}
            </Badge>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-3 w-full"
          onClick={handleView}
        >
          Read more
        </Button>
      </CardContent>
    </Card>
  );
}

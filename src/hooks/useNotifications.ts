import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

export interface Notification {
  id: string;
  type: "task" | "leave" | "announcement";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export function useNotifications() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep max 50
    return newNotification;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to task changes
    const tasksChannel = supabase
      .channel("tasks-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
        },
        (payload: RealtimePostgresChangesPayload<Tables<"tasks">>) => {
          const task = payload.new as Tables<"tasks">;
          // Only notify if assigned to current user
          if (task.assigned_to === user.id) {
            const notification = addNotification({
              type: "task",
              title: "New task assigned",
              description: task.title,
              data: { taskId: task.id },
            });
            toast.info("New task assigned", {
              description: task.title,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
        },
        (payload: RealtimePostgresChangesPayload<Tables<"tasks">>) => {
          const task = payload.new as Tables<"tasks">;
          const oldTask = payload.old as Partial<Tables<"tasks">>;
          
          // Notify if task was just assigned to current user
          if (task.assigned_to === user.id && oldTask.assigned_to !== user.id) {
            addNotification({
              type: "task",
              title: "Task assigned to you",
              description: task.title,
              data: { taskId: task.id },
            });
            toast.info("Task assigned to you", {
              description: task.title,
            });
          }
          
          // Notify if status changed on a task user created
          if (task.created_by === user.id && oldTask.status !== task.status) {
            addNotification({
              type: "task",
              title: `Task moved to ${task.status.replace("_", " ")}`,
              description: task.title,
              data: { taskId: task.id },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to leave request changes
    const leaveChannel = supabase
      .channel("leave-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leave_requests",
        },
        (payload: RealtimePostgresChangesPayload<Tables<"leave_requests">>) => {
          const request = payload.new as Tables<"leave_requests">;
          const oldRequest = payload.old as Partial<Tables<"leave_requests">>;
          
          // Notify user when their request status changes
          if (request.user_id === user.id && oldRequest.status !== request.status) {
            const statusMessages: Record<string, { title: string; variant: "success" | "error" | "info" }> = {
              approved: { title: "Leave request approved", variant: "success" },
              rejected: { title: "Leave request rejected", variant: "error" },
              cancelled: { title: "Leave request cancelled", variant: "info" },
            };
            
            const message = statusMessages[request.status];
            if (message) {
              addNotification({
                type: "leave",
                title: message.title,
                description: `Your leave request has been ${request.status}`,
                data: { requestId: request.id },
              });
              
              if (message.variant === "success") {
                toast.success(message.title);
              } else if (message.variant === "error") {
                toast.error(message.title);
              } else {
                toast.info(message.title);
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leave_requests",
        },
        (payload: RealtimePostgresChangesPayload<Tables<"leave_requests">>) => {
          const request = payload.new as Tables<"leave_requests">;
          
          // Notify managers about new leave requests (not their own)
          if (request.user_id !== user.id) {
            addNotification({
              type: "leave",
              title: "New leave request",
              description: "A team member submitted a leave request",
              data: { requestId: request.id },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to announcement changes
    const announcementsChannel = supabase
      .channel("announcements-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
        },
        (payload: RealtimePostgresChangesPayload<Tables<"announcements">>) => {
          const announcement = payload.new as Tables<"announcements">;
          
          // Check if announcement is published and targets the user
          if (
            announcement.published_at &&
            new Date(announcement.published_at) <= new Date() &&
            (announcement.target_all || announcement.target_department_id === profile?.department_id)
          ) {
            addNotification({
              type: "announcement",
              title: "New announcement",
              description: announcement.title,
              data: { announcementId: announcement.id },
            });
            toast.info("New announcement", {
              description: announcement.title,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, [user, profile?.department_id, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}

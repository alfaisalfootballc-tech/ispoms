import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  target_all: boolean;
  target_department_id: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  department?: {
    name: string;
  } | null;
  is_read?: boolean;
}

export interface Department {
  id: string;
  name: string;
}

export function useAnnouncements() {
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch departments for targeting
  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data as Department[];
    },
    enabled: !!user,
  });

  // Fetch announcements
  const announcementsQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          author:profiles!announcements_created_by_fkey(first_name, last_name, email),
          department:departments(name)
        `)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get read status for each announcement
      const { data: reads } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user!.id);

      const readIds = new Set(reads?.map((r) => r.announcement_id) || []);

      return (data as Announcement[]).map((a) => ({
        ...a,
        is_read: readIds.has(a.id),
      }));
    },
    enabled: !!user,
  });

  // Create announcement
  const createAnnouncement = useMutation({
    mutationFn: async ({
      title,
      content,
      excerpt,
      priority,
      isPinned,
      targetAll,
      targetDepartmentId,
      publishedAt,
      expiresAt,
    }: {
      title: string;
      content: string;
      excerpt?: string;
      priority: AnnouncementPriority;
      isPinned?: boolean;
      targetAll: boolean;
      targetDepartmentId?: string;
      publishedAt?: Date;
      expiresAt?: Date;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("announcements")
        .insert({
          title,
          content,
          excerpt: excerpt || null,
          priority,
          is_pinned: isPinned || false,
          target_all: targetAll,
          target_department_id: targetAll ? null : targetDepartmentId || null,
          published_at: publishedAt?.toISOString() || new Date().toISOString(),
          expires_at: expiresAt?.toISOString() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Announcement created",
        description: "Your announcement has been published.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error.message,
      });
    },
  });

  // Update announcement
  const updateAnnouncement = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      excerpt,
      priority,
      isPinned,
      targetAll,
      targetDepartmentId,
      publishedAt,
      expiresAt,
    }: {
      id: string;
      title?: string;
      content?: string;
      excerpt?: string;
      priority?: AnnouncementPriority;
      isPinned?: boolean;
      targetAll?: boolean;
      targetDepartmentId?: string | null;
      publishedAt?: Date | null;
      expiresAt?: Date | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (excerpt !== undefined) updates.excerpt = excerpt;
      if (priority !== undefined) updates.priority = priority;
      if (isPinned !== undefined) updates.is_pinned = isPinned;
      if (targetAll !== undefined) updates.target_all = targetAll;
      if (targetDepartmentId !== undefined) updates.target_department_id = targetDepartmentId;
      if (publishedAt !== undefined) updates.published_at = publishedAt?.toISOString() || null;
      if (expiresAt !== undefined) updates.expires_at = expiresAt?.toISOString() || null;

      const { error } = await supabase
        .from("announcements")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Announcement updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    },
  });

  // Delete announcement
  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Announcement deleted",
        description: "The announcement has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    },
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("announcement_reads").upsert({
        announcement_id: announcementId,
        user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  // Realtime subscription for announcements
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Filter helpers
  const publishedAnnouncements = announcementsQuery.data?.filter(
    (a) => a.published_at && new Date(a.published_at) <= new Date()
  ) || [];

  const draftAnnouncements = announcementsQuery.data?.filter(
    (a) => !a.published_at || new Date(a.published_at) > new Date()
  ) || [];

  const unreadCount = publishedAnnouncements.filter((a) => !a.is_read).length;

  const canCreate = isAdmin || isManager;

  return {
    announcements: announcementsQuery.data || [],
    publishedAnnouncements,
    draftAnnouncements,
    departments: departmentsQuery.data || [],
    unreadCount,
    isLoading: announcementsQuery.isLoading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsRead,
    canCreate,
  };
}

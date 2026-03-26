import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  totalUsers: number;
  totalTasks: number;
  totalDocuments: number;
  totalAnnouncements: number;
  pendingLeaveRequests: number;
  activeUsers: number;
  usersByRole: { role: string; count: number }[];
  tasksByStatus: { status: string; count: number }[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }[];
}

export function useAdminAnalytics() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      // Fetch all data in parallel
      const [
        profilesResult,
        tasksResult,
        documentsResult,
        announcementsResult,
        leaveRequestsResult,
        userRolesResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id, created_at", { count: "exact" }),
        supabase.from("tasks").select("id, status", { count: "exact" }),
        supabase.from("documents").select("id", { count: "exact" }),
        supabase.from("announcements").select("id", { count: "exact" }),
        supabase.from("leave_requests").select("id, status").eq("status", "pending"),
        supabase.from("user_roles").select("role"),
      ]);

      // Count users by role
      const rolesCounts = userRolesResult.data?.reduce((acc, { role }) => {
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const usersByRole = Object.entries(rolesCounts).map(([role, count]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        count,
      }));

      // Count tasks by status
      const statusCounts = tasksResult.data?.reduce((acc, { status }) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const tasksByStatus = [
        { status: "To Do", count: statusCounts["todo"] || 0 },
        { status: "In Progress", count: statusCounts["in_progress"] || 0 },
        { status: "In Review", count: statusCounts["in_review"] || 0 },
        { status: "Completed", count: statusCounts["completed"] || 0 },
      ];

      // Fetch recent activity (latest tasks, announcements, leave requests)
      const [recentTasks, recentAnnouncements, recentLeave] = await Promise.all([
        supabase
          .from("tasks")
          .select("title, created_at, creator:profiles!tasks_created_by_fkey(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("announcements")
          .select("title, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("leave_requests")
          .select("status, created_at, user:profiles!leave_requests_user_id_fkey(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const recentActivity: AnalyticsData["recentActivity"] = [
        ...(recentTasks.data?.map((t: any) => ({
          type: "task",
          description: `Task "${t.title}" created`,
          timestamp: t.created_at,
          user: t.creator ? `${t.creator.first_name} ${t.creator.last_name}` : undefined,
        })) || []),
        ...(recentAnnouncements.data?.map((a) => ({
          type: "announcement",
          description: `Announcement "${a.title}" published`,
          timestamp: a.created_at,
        })) || []),
        ...(recentLeave.data?.map((l: any) => ({
          type: "leave",
          description: `Leave request ${l.status}`,
          timestamp: l.created_at,
          user: l.user ? `${l.user.first_name} ${l.user.last_name}` : undefined,
        })) || []),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        totalUsers: profilesResult.count || 0,
        totalTasks: tasksResult.count || 0,
        totalDocuments: documentsResult.count || 0,
        totalAnnouncements: announcementsResult.count || 0,
        pendingLeaveRequests: leaveRequestsResult.data?.length || 0,
        activeUsers: profilesResult.count || 0,
        usersByRole,
        tasksByStatus,
        recentActivity: recentActivity.slice(0, 10),
      };
    },
    enabled: isAdmin,
    staleTime: 30000, // Cache for 30 seconds
  });
}

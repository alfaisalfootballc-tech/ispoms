import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  activeTasks: number;
  completedTasks: number;
  totalDocuments: number;
  pendingLeaveRequests: number;
  todayAttendance: number;
  announcementsCount: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Parallel queries for better performance
      const [
        employeesResult,
        tasksResult,
        documentsResult,
        leaveRequestsResult,
        attendanceResult,
        announcementsResult,
      ] = await Promise.all([
        supabase.from("employees").select("id, status"),
        supabase.from("tasks").select("id, status"),
        supabase.from("documents").select("id"),
        supabase.from("leave_requests").select("id, status"),
        supabase
          .from("attendance_records")
          .select("id")
          .eq("date", new Date().toISOString().split("T")[0]),
        supabase.from("announcements").select("id").not("published_at", "is", null),
      ]);

      const employees = employeesResult.data || [];
      const tasks = tasksResult.data || [];
      const documents = documentsResult.data || [];
      const leaveRequests = leaveRequestsResult.data || [];
      const attendance = attendanceResult.data || [];
      const announcements = announcementsResult.data || [];

      return {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === "active").length,
        activeTasks: tasks.filter((t) => t.status !== "completed").length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
        totalDocuments: documents.length,
        pendingLeaveRequests: leaveRequests.filter((l) => l.status === "pending").length,
        todayAttendance: attendance.length,
        announcementsCount: announcements.length,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds as fallback
  });

  // Realtime subscriptions for all relevant tables
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel("stats-employees")
        .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        })
        .subscribe(),
      supabase
        .channel("stats-tasks")
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        })
        .subscribe(),
      supabase
        .channel("stats-documents")
        .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        })
        .subscribe(),
      supabase
        .channel("stats-leave")
        .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        })
        .subscribe(),
      supabase
        .channel("stats-attendance")
        .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        })
        .subscribe(),
      supabase
        .channel("stats-announcements")
        .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user, queryClient]);

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
  };
}

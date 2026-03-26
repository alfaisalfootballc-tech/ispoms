import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Users,
  ClipboardList,
  FileText,
  Megaphone,
  Calendar,
  Shield,
  Loader2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { RecentActivityList } from "@/components/admin/RecentActivityList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: analytics, isLoading, error } = useAdminAnalytics();

  // Redirect non-admin/manager users
  if (!authLoading && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isLoading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load analytics</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System overview and user management
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
            <Shield className="w-4 h-4 text-primary" />
            <span>
              Role: <span className="text-primary font-medium">{isAdmin ? "Admin" : "Manager"}</span>
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Total Users"
            value={analytics?.totalUsers.toString() || "0"}
            icon={Users}
            variant="primary"
          />
          <KPICard
            title="Total Tasks"
            value={analytics?.totalTasks.toString() || "0"}
            icon={ClipboardList}
            variant="warning"
          />
          <KPICard
            title="Documents"
            value={analytics?.totalDocuments.toString() || "0"}
            icon={FileText}
            variant="info"
          />
          <KPICard
            title="Announcements"
            value={analytics?.totalAnnouncements.toString() || "0"}
            icon={Megaphone}
            variant="success"
          />
          <KPICard
            title="Pending Leave"
            value={analytics?.pendingLeaveRequests.toString() || "0"}
            icon={Calendar}
            variant="primary"
          />
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                User Management
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AnalyticsCharts
                  usersByRole={analytics?.usersByRole || []}
                  tasksByStatus={analytics?.tasksByStatus || []}
                />
              </div>
              <div>
                <RecentActivityList
                  activities={analytics?.recentActivity || []}
                />
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <UserManagementTable />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

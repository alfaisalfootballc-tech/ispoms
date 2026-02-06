import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { UpcomingLeave } from "@/components/dashboard/UpcomingLeave";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  ClipboardList, 
  FileText, 
  CalendarCheck,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, isLoading } = useDashboardStats();

  const firstName = user?.user_metadata?.first_name || "User";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {firstName}! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
            <TrendingUp className="w-4 h-4 text-success" />
            <span>System Status: <span className="text-success font-medium">Operational</span></span>
          </div>
        </div>

        {/* KPI Cards - Live data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <KPICard
                title="Total Employees"
                value={stats?.totalEmployees?.toString() || "0"}
                change={stats?.activeEmployees || 0}
                changeLabel="active employees"
                icon={Users}
                variant="primary"
              />
              <KPICard
                title="Active Tasks"
                value={stats?.activeTasks?.toString() || "0"}
                change={stats?.completedTasks || 0}
                changeLabel="completed"
                icon={ClipboardList}
                variant="warning"
              />
              <KPICard
                title="Documents"
                value={stats?.totalDocuments?.toString() || "0"}
                change={0}
                changeLabel="in system"
                icon={FileText}
                variant="info"
              />
              <KPICard
                title="Leave Requests"
                value={stats?.pendingLeaveRequests?.toString() || "0"}
                change={stats?.pendingLeaveRequests || 0}
                changeLabel="pending approval"
                icon={CalendarCheck}
                variant="success"
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks & Activity */}
          <div className="lg:col-span-2 space-y-6">
            <TasksOverview />
            <RecentActivity />
          </div>

          {/* Right Column - Leave & Quick Actions */}
          <div className="space-y-6">
            <QuickActions />
            <UpcomingLeave />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

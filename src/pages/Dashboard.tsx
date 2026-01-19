import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { UpcomingLeave } from "@/components/dashboard/UpcomingLeave";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { 
  Users, 
  ClipboardList, 
  FileText, 
  CalendarCheck,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, John! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
            <TrendingUp className="w-4 h-4 text-success" />
            <span>System Status: <span className="text-success font-medium">Operational</span></span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Employees"
            value="248"
            change={12}
            changeLabel="from last month"
            icon={Users}
            variant="primary"
          />
          <KPICard
            title="Active Tasks"
            value="64"
            change={-5}
            changeLabel="from yesterday"
            icon={ClipboardList}
            variant="warning"
          />
          <KPICard
            title="Documents"
            value="1,482"
            change={8}
            changeLabel="this week"
            icon={FileText}
            variant="info"
          />
          <KPICard
            title="Leave Requests"
            value="12"
            change={3}
            changeLabel="pending approval"
            icon={CalendarCheck}
            variant="success"
          />
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

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClockInOutCard } from "@/components/attendance/ClockInOutCard";
import { AttendanceHistoryTable } from "@/components/attendance/AttendanceHistoryTable";
import { TeamAttendanceTable } from "@/components/attendance/TeamAttendanceTable";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Users } from "lucide-react";

export default function Attendance() {
  const { role } = useAuth();
  const isManagerOrAdmin = role === "manager" || role === "admin";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track your work hours and attendance status
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ClockInOutCard />
          </div>
          
          <div className="lg:col-span-2">
            {isManagerOrAdmin ? (
              <Tabs defaultValue="my-history" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="my-history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    My History
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="my-history" className="mt-4">
                  <AttendanceHistoryTable />
                </TabsContent>
                <TabsContent value="team" className="mt-4">
                  <TeamAttendanceTable />
                </TabsContent>
              </Tabs>
            ) : (
              <AttendanceHistoryTable />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/hooks/useEmployees";
import { CreateEmployeeDialog } from "@/components/employees/CreateEmployeeDialog";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Building2,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const statusStyles = {
  active: "bg-success/10 text-success",
  on_leave: "bg-warning/10 text-warning",
  inactive: "bg-muted text-muted-foreground",
};

export default function Employees() {
  const { employees, stats, isLoading } = useEmployees();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${employee.profile?.first_name || ""} ${employee.profile?.last_name || ""}`.toLowerCase();
    const email = employee.profile?.email?.toLowerCase() || "";
    const department = employee.department?.name?.toLowerCase() || "";
    const jobTitle = employee.job_title?.toLowerCase() || "";
    
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      department.includes(searchLower) ||
      jobTitle.includes(searchLower)
    );
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">Manage your team members and their information</p>
          </div>
          <CreateEmployeeDialog />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees by name, email, or department..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="secondary">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Stats - Live from database */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[76px] rounded-xl" />
            ))
          ) : (
            [
              { label: "Total Employees", value: stats.total.toString(), color: "text-foreground" },
              { label: "Active", value: stats.active.toString(), color: "text-success" },
              { label: "On Leave", value: stats.onLeave.toString(), color: "text-warning" },
              { label: "Inactive", value: stats.inactive.toString(), color: "text-muted-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl p-4 border border-border/50">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            ))
          )}
        </div>

        {/* Employee Grid - Live from database */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[220px] rounded-xl" />
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No employees found</p>
            <p className="text-sm mt-1">
              {searchQuery ? "Try a different search term" : "Add your first employee to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee, index) => (
              <div
                key={employee.id}
                className="bg-card border border-border/50 rounded-xl p-5 hover:shadow-lg transition-shadow animate-fade-in group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(employee.profile?.first_name, employee.profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {employee.profile?.first_name} {employee.profile?.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{employee.job_title || "No title"}</p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-muted transition-all">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{employee.department?.name || "No department"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.profile?.email}</span>
                  </div>
                  {employee.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{employee.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                    statusStyles[employee.status as keyof typeof statusStyles]
                  )}>
                    {employee.status?.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {employee.phone && (
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

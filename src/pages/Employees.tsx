import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEmployees, Employee } from "@/hooks/useEmployees";
import { CreateEmployeeDialog } from "@/components/employees/CreateEmployeeDialog";
import { EditEmployeeDialog } from "@/components/employees/EditEmployeeDialog";
import { DeleteEmployeeDialog } from "@/components/employees/DeleteEmployeeDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Building2,
  MapPin,
  Pencil,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

const statusStyles = {
  active: "bg-success/10 text-success",
  on_leave: "bg-warning/10 text-warning",
  inactive: "bg-muted text-muted-foreground",
};

export default function Employees() {
  const { employees, stats, isLoading, deleteEmployee, isDeleting } = useEmployees();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const departments = useMemo(() => {
    const depts = new Map<string, string>();
    employees.forEach((e) => {
      if (e.department?.id && e.department?.name) {
        depts.set(e.department.id, e.department.name);
      }
    });
    return Array.from(depts, ([id, name]) => ({ id, name }));
  }, [employees]);

  const filteredEmployees = employees.filter((employee) => {
    if (statusFilter !== "all" && employee.status !== statusFilter) return false;
    if (departmentFilter !== "all" && employee.department?.id !== departmentFilter) return false;

    const searchLower = searchQuery.toLowerCase();
    if (!searchLower) return true;

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
          {isAdmin && <CreateEmployeeDialog />}
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
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
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
                  {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="p-2 rounded-lg hover:bg-muted focus:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        aria-label="Employee options"
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingEmployee(employee)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingEmployee(employee)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
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

        {/* Edit Employee Dialog */}
        {editingEmployee && (
          <EditEmployeeDialog
            employee={editingEmployee}
            open={!!editingEmployee}
            onOpenChange={(open) => !open && setEditingEmployee(null)}
          />
        )}

        {/* Delete Employee Dialog */}
        <DeleteEmployeeDialog
          employee={deletingEmployee}
          open={!!deletingEmployee}
          onOpenChange={(open) => !open && setDeletingEmployee(null)}
          onConfirm={async () => {
            if (deletingEmployee) {
              await deleteEmployee(deletingEmployee.id);
              setDeletingEmployee(null);
            }
          }}
          isDeleting={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}

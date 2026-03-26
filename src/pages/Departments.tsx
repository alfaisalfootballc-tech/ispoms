import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDepartments, Department } from "@/hooks/useDepartments";
import { useAuth } from "@/contexts/AuthContext";
import { CreateDepartmentDialog } from "@/components/departments/CreateDepartmentDialog";
import { EditDepartmentDialog } from "@/components/departments/EditDepartmentDialog";
import { DeleteDepartmentDialog } from "@/components/departments/DeleteDepartmentDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Plus, MoreVertical, Pencil, Trash2, Users, UserCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Departments() {
  const { isAdmin } = useAuth();
  const {
    departments, managers, isLoading,
    createDepartment, updateDepartment, deleteDepartment,
    isCreating, isUpdating, isDeleting,
  } = useDepartments();

  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground text-sm">
              Manage organizational departments and their managers
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Department
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-sm text-muted-foreground">Total Departments</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-xl bg-accent/50">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {departments.reduce((sum, d) => sum + (d.employee_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Employees</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-xl bg-secondary">
                <UserCheck className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {departments.filter((d) => d.manager_id).length}
                </p>
                <p className="text-sm text-muted-foreground">With Managers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No departments found</p>
              <p className="text-sm">
                {searchQuery ? "Try a different search term" : "Create your first department to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((dept) => {
              const manager = dept.manager;
              const managerName = manager?.first_name && manager?.last_name
                ? `${manager.first_name} ${manager.last_name}`
                : manager?.email || "Unassigned";
              const initials = manager?.first_name && manager?.last_name
                ? `${manager.first_name[0]}${manager.last_name[0]}`
                : "?";

              return (
                <Card key={dept.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                        {dept.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {dept.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditDept(dept)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteDept(dept)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs text-muted-foreground">Manager</p>
                          <p className="text-sm font-medium">{managerName}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {dept.employee_count}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateDepartmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        managers={managers}
        onSubmit={createDepartment}
        isPending={isCreating}
      />
      <EditDepartmentDialog
        open={!!editDept}
        onOpenChange={(open) => !open && setEditDept(null)}
        department={editDept}
        managers={managers}
        onSubmit={updateDepartment}
        isPending={isUpdating}
      />
      <DeleteDepartmentDialog
        open={!!deleteDept}
        onOpenChange={(open) => !open && setDeleteDept(null)}
        department={deleteDept}
        onConfirm={async () => {
          if (deleteDept) await deleteDepartment(deleteDept.id);
        }}
        isPending={isDeleting}
      />
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Building2,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

const employees = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 123-4567",
    department: "Marketing",
    role: "Marketing Manager",
    location: "New York",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    initials: "SJ",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    phone: "+1 (555) 234-5678",
    department: "Engineering",
    role: "Senior Developer",
    location: "San Francisco",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    initials: "MC",
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily.davis@company.com",
    phone: "+1 (555) 345-6789",
    department: "Human Resources",
    role: "HR Specialist",
    location: "Chicago",
    status: "on-leave",
    initials: "ED",
  },
  {
    id: "4",
    name: "David Miller",
    email: "david.miller@company.com",
    phone: "+1 (555) 456-7890",
    department: "Finance",
    role: "Financial Analyst",
    location: "Boston",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    initials: "DM",
  },
  {
    id: "5",
    name: "Jessica Brown",
    email: "jessica.brown@company.com",
    phone: "+1 (555) 567-8901",
    department: "Operations",
    role: "Operations Manager",
    location: "Seattle",
    status: "active",
    initials: "JB",
  },
  {
    id: "6",
    name: "Robert Wilson",
    email: "robert.wilson@company.com",
    phone: "+1 (555) 678-9012",
    department: "Engineering",
    role: "Tech Lead",
    location: "Austin",
    status: "inactive",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    initials: "RW",
  },
];

const statusStyles = {
  active: "bg-success/10 text-success",
  "on-leave": "bg-warning/10 text-warning",
  inactive: "bg-muted text-muted-foreground",
};

export default function Employees() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">Manage your team members and their information</p>
          </div>
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees by name, email, or department..."
              className="input-enterprise pl-10"
            />
          </div>
          <Button variant="secondary">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Employees", value: "248", color: "text-foreground" },
            { label: "Active", value: "232", color: "text-success" },
            { label: "On Leave", value: "12", color: "text-warning" },
            { label: "Inactive", value: "4", color: "text-muted-foreground" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-4 border border-border/50">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee, index) => (
            <div
              key={employee.id}
              className="card-interactive p-5 animate-fade-in group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {employee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-muted transition-all">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{employee.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <span className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                  statusStyles[employee.status as keyof typeof statusStyles]
                )}>
                  {employee.status.replace("-", " ")}
                </span>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

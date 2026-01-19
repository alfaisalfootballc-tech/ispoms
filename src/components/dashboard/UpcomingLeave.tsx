import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays } from "lucide-react";

interface LeaveRequest {
  id: string;
  employee: {
    name: string;
    department: string;
    avatar?: string;
    initials: string;
  };
  type: string;
  dates: string;
  status: "approved" | "pending";
}

const leaveRequests: LeaveRequest[] = [
  {
    id: "1",
    employee: {
      name: "Sarah Johnson",
      department: "Marketing",
      initials: "SJ",
    },
    type: "Annual Leave",
    dates: "Dec 24 - Dec 26",
    status: "approved",
  },
  {
    id: "2",
    employee: {
      name: "David Miller",
      department: "Engineering",
      initials: "DM",
    },
    type: "Sick Leave",
    dates: "Dec 21 - Dec 22",
    status: "pending",
  },
  {
    id: "3",
    employee: {
      name: "Emma Wilson",
      department: "HR",
      initials: "EW",
    },
    type: "Personal Leave",
    dates: "Dec 28",
    status: "approved",
  },
];

export function UpcomingLeave() {
  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Upcoming Leave</h3>
        <button className="text-sm text-primary hover:underline">View calendar</button>
      </div>

      <div className="space-y-4">
        {leaveRequests.map((request, index) => (
          <div
            key={request.id}
            className="flex items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.employee.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {request.employee.initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{request.employee.name}</p>
              <p className="text-xs text-muted-foreground">{request.employee.department}</p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5 text-sm">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{request.dates}</span>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                request.status === "approved" 
                  ? "bg-success/10 text-success" 
                  : "bg-warning/10 text-warning"
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground">12</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">On Leave Today</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-warning">5</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-success">28</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">This Month</p>
        </div>
      </div>
    </div>
  );
}

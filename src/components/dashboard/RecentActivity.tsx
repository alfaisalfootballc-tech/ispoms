import { 
  UserPlus, 
  FileCheck, 
  CalendarCheck, 
  Megaphone, 
  ClipboardCheck,
  FileUp,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "user" | "task" | "leave" | "announcement" | "document";
  title: string;
  description: string;
  time: string;
  user: {
    name: string;
    avatar?: string;
  };
}

const activities: Activity[] = [
  {
    id: "1",
    type: "user",
    title: "New employee added",
    description: "Sarah Johnson joined the Marketing team",
    time: "5 min ago",
    user: { name: "Admin" },
  },
  {
    id: "2",
    type: "task",
    title: "Task completed",
    description: "Q4 Financial Report has been completed",
    time: "15 min ago",
    user: { name: "Michael Chen" },
  },
  {
    id: "3",
    type: "leave",
    title: "Leave request approved",
    description: "Annual leave for Dec 24-26 approved",
    time: "1 hour ago",
    user: { name: "Emily Davis" },
  },
  {
    id: "4",
    type: "announcement",
    title: "New announcement",
    description: "Holiday schedule update for the team",
    time: "2 hours ago",
    user: { name: "HR Department" },
  },
  {
    id: "5",
    type: "document",
    title: "Document uploaded",
    description: "Employee handbook v2.0 uploaded",
    time: "3 hours ago",
    user: { name: "Admin" },
  },
];

const typeConfig: Record<Activity["type"], { icon: LucideIcon; color: string }> = {
  user: { icon: UserPlus, color: "text-primary bg-primary/10" },
  task: { icon: ClipboardCheck, color: "text-success bg-success/10" },
  leave: { icon: CalendarCheck, color: "text-info bg-info/10" },
  announcement: { icon: Megaphone, color: "text-warning bg-warning/10" },
  document: { icon: FileUp, color: "text-accent bg-accent/10" },
};

export function RecentActivity() {
  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          
          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-4 animate-fade-in",
                index !== activities.length - 1 && "pb-4 border-b border-border/50"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.user.name}</span>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

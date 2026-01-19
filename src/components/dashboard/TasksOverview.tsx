import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  assignee: {
    name: string;
    avatar?: string;
    initials: string;
  };
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Complete Q4 budget review",
    priority: "high",
    status: "in-progress",
    dueDate: "Today",
    assignee: { name: "John Doe", initials: "JD" },
  },
  {
    id: "2",
    title: "Update employee handbook",
    priority: "medium",
    status: "pending",
    dueDate: "Tomorrow",
    assignee: { name: "Sarah Wilson", initials: "SW" },
  },
  {
    id: "3",
    title: "Review marketing proposal",
    priority: "low",
    status: "pending",
    dueDate: "Dec 22",
    assignee: { name: "Michael Chen", initials: "MC" },
  },
  {
    id: "4",
    title: "Prepare annual report",
    priority: "high",
    status: "completed",
    dueDate: "Dec 20",
    assignee: { name: "Emily Davis", initials: "ED" },
  },
];

const priorityConfig = {
  high: { label: "High", class: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", class: "bg-warning/10 text-warning" },
  low: { label: "Low", class: "bg-success/10 text-success" },
};

const statusConfig = {
  pending: { icon: Clock, class: "text-muted-foreground" },
  "in-progress": { icon: AlertCircle, class: "text-warning" },
  completed: { icon: CheckCircle2, class: "text-success" },
};

export function TasksOverview() {
  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Tasks Overview</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => {
          const priority = priorityConfig[task.priority];
          const status = statusConfig[task.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={task.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <StatusIcon className={cn("w-5 h-5 flex-shrink-0", status.class)} />
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  task.status === "completed" && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", priority.class)}>
                    {priority.label}
                  </span>
                  <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
                </div>
              </div>

              <Avatar className="h-7 w-7">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {task.assignee.initials}
                </AvatarFallback>
              </Avatar>

              <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

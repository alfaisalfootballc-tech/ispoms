import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const priorityConfig = {
  high: { label: "High", class: "bg-destructive/10 text-destructive" },
  urgent: { label: "Urgent", class: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", class: "bg-warning/10 text-warning" },
  low: { label: "Low", class: "bg-success/10 text-success" },
};

const statusConfig = {
  todo: { icon: Clock, class: "text-muted-foreground" },
  in_progress: { icon: AlertCircle, class: "text-warning" },
  in_review: { icon: AlertCircle, class: "text-info" },
  completed: { icon: CheckCircle2, class: "text-success" },
};

export function TasksOverview() {
  const { tasks, isLoading } = useTasks();

  // Show latest 4 tasks
  const recentTasks = tasks.slice(0, 4);

  if (isLoading) {
    return (
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Tasks Overview</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Tasks Overview</h3>
        <Link to="/tasks" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {recentTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet. Create your first task!</p>
          </div>
        ) : (
          recentTasks.map((task, index) => {
            const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;
            const StatusIcon = status.icon;

            const assigneeInitials = task.assignee
              ? `${task.assignee.first_name?.[0] || ""}${task.assignee.last_name?.[0] || ""}`.toUpperCase() || "?"
              : "?";

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
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {task.assignee && (
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={task.assignee.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                )}

                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

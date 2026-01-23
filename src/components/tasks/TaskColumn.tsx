import { cn } from "@/lib/utils";
import { Task } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { LucideIcon } from "lucide-react";

interface TaskColumnProps {
  title: string;
  icon: LucideIcon;
  color: string;
  tasks: Task[];
}

export function TaskColumn({ title, icon: Icon, color, tasks }: TaskColumnProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("p-1.5 rounded-md", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TaskCard task={task} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

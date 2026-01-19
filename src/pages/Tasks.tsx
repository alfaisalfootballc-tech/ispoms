import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Calendar, 
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle2,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  assignees: { name: string; avatar?: string; initials: string }[];
  tags: string[];
}

interface Column {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  tasks: Task[];
}

const columns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    icon: Clock,
    color: "text-muted-foreground",
    tasks: [
      {
        id: "1",
        title: "Review Q4 Marketing Budget",
        description: "Analyze and approve marketing expenses",
        priority: "high",
        dueDate: "Dec 22",
        assignees: [{ name: "Sarah J", initials: "SJ" }],
        tags: ["Finance", "Urgent"],
      },
      {
        id: "2",
        title: "Update Employee Handbook",
        description: "Add new remote work policies",
        priority: "medium",
        dueDate: "Dec 25",
        assignees: [
          { name: "Emily D", initials: "ED" },
          { name: "Michael C", initials: "MC" },
        ],
        tags: ["HR", "Documentation"],
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: AlertCircle,
    color: "text-warning",
    tasks: [
      {
        id: "3",
        title: "Implement SSO Authentication",
        description: "Integrate Azure AD for single sign-on",
        priority: "high",
        dueDate: "Dec 20",
        assignees: [
          { name: "David M", initials: "DM", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face" },
        ],
        tags: ["Engineering", "Security"],
      },
      {
        id: "4",
        title: "Design System Updates",
        description: "Update color palette and components",
        priority: "low",
        dueDate: "Dec 28",
        assignees: [{ name: "Jessica B", initials: "JB" }],
        tags: ["Design"],
      },
    ],
  },
  {
    id: "review",
    title: "In Review",
    icon: AlertCircle,
    color: "text-info",
    tasks: [
      {
        id: "5",
        title: "Annual Performance Reports",
        description: "Compile and review all team reports",
        priority: "medium",
        dueDate: "Dec 21",
        assignees: [
          { name: "Robert W", initials: "RW", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" },
        ],
        tags: ["HR", "Reports"],
      },
    ],
  },
  {
    id: "completed",
    title: "Completed",
    icon: CheckCircle2,
    color: "text-success",
    tasks: [
      {
        id: "6",
        title: "Server Migration",
        description: "Migrate to new cloud infrastructure",
        priority: "high",
        dueDate: "Dec 18",
        assignees: [
          { name: "Michael C", initials: "MC", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" },
        ],
        tags: ["Infrastructure"],
      },
    ],
  },
];

const priorityStyles = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
};

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {task.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
            priorityStyles[task.priority]
          )}>
            {task.priority}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {task.dueDate}
          </div>
        </div>
        
        <div className="flex -space-x-2">
          {task.assignees.slice(0, 3).map((assignee, i) => (
            <Avatar key={i} className="h-6 w-6 border-2 border-card">
              <AvatarImage src={assignee.avatar} />
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {assignee.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          {task.assignees.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] font-medium">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Manage and track all team tasks in one place</p>
          </div>
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const Icon = column.icon;
            return (
              <div
                key={column.id}
                className="bg-muted/30 rounded-xl p-4 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", column.color)} />
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      {column.tasks.length}
                    </span>
                  </div>
                  <button className="p-1 rounded hover:bg-muted transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {column.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TaskCard task={task} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

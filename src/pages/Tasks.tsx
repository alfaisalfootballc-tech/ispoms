import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTasks, TaskStatus } from "@/hooks/useTasks";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskColumn } from "@/components/tasks/TaskColumn";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ListTodo,
  Clock,
  Eye,
  CheckCircle2,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { TaskPriority } from "@/hooks/useTasks";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

const columns = [
  {
    id: "todo" as TaskStatus,
    title: "To Do",
    icon: ListTodo,
    color: "bg-muted text-muted-foreground",
  },
  {
    id: "in_progress" as TaskStatus,
    title: "In Progress",
    icon: Clock,
    color: "bg-warning/10 text-warning",
  },
  {
    id: "in_review" as TaskStatus,
    title: "In Review",
    icon: Eye,
    color: "bg-info/10 text-info",
  },
  {
    id: "completed" as TaskStatus,
    title: "Completed",
    icon: CheckCircle2,
    color: "bg-success/10 text-success",
  },
];

export default function Tasks() {
  const { tasksByStatus, stats, isLoading, error, updateTaskStatus } = useTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  // Filter tasks based on search and priority
  const filterTasks = (tasks: typeof tasksByStatus.todo) => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update task status if moved to a different column
    if (destination.droppableId !== source.droppableId) {
      await updateTaskStatus({
        id: draggableId,
        status: destination.droppableId as TaskStatus,
      });
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load tasks</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track your team's tasks
            </p>
          </div>
          <CreateTaskDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-muted-foreground">{stats.todo}</p>
            <p className="text-sm text-muted-foreground">To Do</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-warning">{stats.inProgress}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-success">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {columns.map((column) => (
                <TaskColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  icon={column.icon}
                  color={column.color}
                  tasks={filterTasks(
                    tasksByStatus[column.id as keyof typeof tasksByStatus]
                  )}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </DashboardLayout>
  );
}
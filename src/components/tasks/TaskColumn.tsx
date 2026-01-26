import { cn } from "@/lib/utils";
import { Task, TaskStatus } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { LucideIcon } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  icon: LucideIcon;
  color: string;
  tasks: Task[];
}

export function TaskColumn({ id, title, icon: Icon, color, tasks }: TaskColumnProps) {
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

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 space-y-3 overflow-y-auto pr-1 min-h-[200px] rounded-lg transition-colors",
              snapshot.isDraggingOver && "bg-muted/50"
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tasks
              </div>
            ) : (
              tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "animate-fade-in",
                        snapshot.isDragging && "rotate-2 scale-105"
                      )}
                      style={{
                        ...provided.draggableProps.style,
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <TaskCard task={task} />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

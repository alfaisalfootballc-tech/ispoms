import { 
  UserPlus, 
  ClipboardPlus, 
  FileUp, 
  Megaphone, 
  CalendarPlus,
  Send,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    icon: UserPlus,
    label: "Add Employee",
    description: "Register new staff",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    icon: ClipboardPlus,
    label: "Create Task",
    description: "Assign new work",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  {
    icon: FileUp,
    label: "Upload Document",
    description: "Share files",
    color: "bg-info/10 text-info hover:bg-info/20",
  },
  {
    icon: Megaphone,
    label: "Announcement",
    description: "Broadcast message",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  {
    icon: CalendarPlus,
    label: "Request Leave",
    description: "Apply for time off",
    color: "bg-accent/10 text-accent hover:bg-accent/20",
  },
  {
    icon: Send,
    label: "Send Email",
    description: "Quick notification",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
];

export function QuickActions() {
  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action, index) => (
          <button
            key={action.label}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 animate-fade-in hover:scale-105",
              action.color
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <action.icon className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium text-sm">{action.label}</p>
              <p className="text-[10px] opacity-70">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { formatDistanceToNow } from "date-fns";
import { ClipboardList, Megaphone, Calendar, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface RecentActivityListProps {
  activities: Activity[];
}

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  task: { icon: ClipboardList, color: "text-warning" },
  announcement: { icon: Megaphone, color: "text-info" },
  leave: { icon: Calendar, color: "text-success" },
  default: { icon: Activity, color: "text-muted-foreground" },
};

export function RecentActivityList({ activities }: RecentActivityListProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 h-full">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No recent activity
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = typeConfig[activity.type] || typeConfig.default;
            const Icon = config.icon;

            return (
              <div
                key={index}
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.user && (
                      <span className="text-xs text-muted-foreground">
                        by {activity.user}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

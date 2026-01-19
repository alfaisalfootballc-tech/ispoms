import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
}: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const variantStyles = {
    default: "bg-card border-border/50",
    primary: "bg-gradient-primary border-transparent text-white",
    success: "bg-success/5 border-success/20",
    warning: "bg-warning/5 border-warning/20",
    info: "bg-info/5 border-info/20",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    primary: "bg-white/20 text-white",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-6 border transition-all duration-200 hover:shadow-md group",
        variantStyles[variant]
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Background Decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              variant === "primary" ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight",
              variant === "primary" ? "text-white" : "text-foreground"
            )}
          >
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive && <TrendingUp className="w-4 h-4 text-success" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-destructive" />}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              {changeLabel && (
                <span
                  className={cn(
                    "text-xs",
                    variant === "primary" ? "text-white/60" : "text-muted-foreground"
                  )}
                >
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            iconStyles[variant]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LeaveBalance } from "@/hooks/useLeaveManagement";

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
}

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const { leave_type, total_days, used_days, pending_days } = balance;
  const available = Math.max(0, total_days - used_days - pending_days);
  const usedPercentage = total_days > 0 ? (used_days / total_days) * 100 : 0;
  const pendingPercentage = total_days > 0 ? (pending_days / total_days) * 100 : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: leave_type?.color || "#3b82f6" }}
          />
          <h3 className="font-medium text-sm">{leave_type?.name}</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-semibold text-lg">{available}</span>
          </div>

          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all"
              style={{ width: `${usedPercentage}%` }}
            />
            <div
              className="absolute top-0 h-full bg-amber-500 transition-all"
              style={{ left: `${usedPercentage}%`, width: `${pendingPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-muted-foreground">Total</p>
              <p className="font-medium">{total_days}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Used</p>
              <p className="font-medium text-primary">{used_days}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Pending</p>
              <p className="font-medium text-amber-500">{pending_days}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Calendar, Clock, User, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LeaveRequest, useLeaveManagement } from "@/hooks/useLeaveManagement";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewRequestDialogProps {
  request: LeaveRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewRequestDialog({ request, open, onOpenChange }: ReviewRequestDialogProps) {
  const { reviewRequest, referToSuperAdmin } = useLeaveManagement();
  const { role } = useAuth();
  const [notes, setNotes] = useState("");

  const isAdmin = role === "admin";
  const isSuperAdmin = role === "super_admin";
  const isReferred = (request as any).referred_to_super_admin;

  const userName = request.user
    ? `${request.user.first_name || ""} ${request.user.last_name || ""}`.trim() ||
      request.user.email
    : "Unknown";

  const handleApprove = async () => {
    await reviewRequest.mutateAsync({
      requestId: request.id,
      status: "approved",
      notes: notes.trim() || undefined,
    });
    setNotes("");
    onOpenChange(false);
  };

  const handleReject = async () => {
    await reviewRequest.mutateAsync({
      requestId: request.id,
      status: "rejected",
      notes: notes.trim() || undefined,
    });
    setNotes("");
    onOpenChange(false);
  };

  const handleRefer = async () => {
    await referToSuperAdmin.mutateAsync({
      requestId: request.id,
      notes: notes.trim() || undefined,
    });
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Review Leave Request</DialogTitle>
          <DialogDescription>
            Approve, reject{isAdmin && !isReferred ? ", or refer to Super Admin" : ""} this leave request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isReferred && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                ⚡ Referred to Super Admin for review
              </p>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{userName}</span>
              </div>
              <Badge
                variant="outline"
                style={{
                  borderColor: request.leave_type?.color,
                  color: request.leave_type?.color,
                }}
              >
                {request.leave_type?.name}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {format(new Date(request.start_date), "MMM d")} -{" "}
                    {format(new Date(request.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Days</p>
                  <p className="font-medium">{request.days_count} day{request.days_count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>

            {request.reason && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm">{request.reason}</p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-notes">Review Notes (optional)</Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your decision..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isAdmin && !isReferred && (
            <Button
              variant="secondary"
              onClick={handleRefer}
              disabled={referToSuperAdmin.isPending}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Refer to Super Admin
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={reviewRequest.isPending}
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={reviewRequest.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

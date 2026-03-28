import { useState } from "react";
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  User, 
  MoreVertical, 
  Check, 
  X, 
  Trash2,
  MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeaveRequest, useLeaveManagement } from "@/hooks/useLeaveManagement";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewRequestDialog } from "./ReviewRequestDialog";

interface LeaveRequestCardProps {
  request: LeaveRequest;
  showUser?: boolean;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <Check className="w-3 h-3" />;
    case "rejected":
      return <X className="w-3 h-3" />;
    default:
      return null;
  }
};

export function LeaveRequestCard({ request, showUser = false }: LeaveRequestCardProps) {
  const { user } = useAuth();
  const { cancelRequest, deleteRequest, canApprove } = useLeaveManagement();
  const [showReview, setShowReview] = useState(false);

  const isOwner = user?.id === request.user_id;
  const isPending = request.status === "pending";
  const canReview = canApprove && isPending && !isOwner;
  const canCancel = isOwner && (isPending || request.status === "approved");
  const canDelete = isOwner && isPending;

  const userName = request.user
    ? `${request.user.first_name || ""} ${request.user.last_name || ""}`.trim() ||
      request.user.email
    : "Unknown";

  const reviewerName = request.reviewer
    ? `${request.reviewer.first_name || ""} ${request.reviewer.last_name || ""}`.trim()
    : null;

  const getInitials = () => {
    if (request.user?.first_name && request.user?.last_name) {
      return `${request.user.first_name[0]}${request.user.last_name[0]}`.toUpperCase();
    }
    return request.user?.email?.[0].toUpperCase() || "U";
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {showUser && (
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {showUser && (
                    <span className="font-medium text-sm">{userName}</span>
                  )}
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs"
                    style={{
                      borderColor: request.leave_type?.color,
                      color: request.leave_type?.color,
                    }}
                  >
                    {request.leave_type?.name}
                  </Badge>
                  <Badge variant={getStatusVariant(request.status)} className="gap-1 text-xs capitalize">
                    {getStatusIcon(request.status)}
                    {request.status}
                  </Badge>
                  {(request as any).referred_to_super_admin && (
                    <Badge variant="outline" className="gap-1 text-xs border-amber-500 text-amber-600">
                      Referred to Super Admin
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(request.start_date), "MMM d")} -{" "}
                      {format(new Date(request.end_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{request.days_count} day{request.days_count !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {request.reason && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {request.reason}
                  </p>
                )}

                {request.review_notes && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <span className="font-medium">Review note: </span>
                    {request.review_notes}
                  </div>
                )}

                {reviewerName && request.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Reviewed by {reviewerName} on{" "}
                    {format(new Date(request.reviewed_at), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>

            {(canReview || canCancel || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canReview && (
                    <>
                      <DropdownMenuItem onClick={() => setShowReview(true)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Review Request
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {canCancel && (
                    <DropdownMenuItem
                      onClick={() => cancelRequest.mutate(request.id)}
                      className="text-amber-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Request
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm("Delete this request?")) {
                          deleteRequest.mutate(request.id);
                        }
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Request
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      <ReviewRequestDialog
        request={request}
        open={showReview}
        onOpenChange={setShowReview}
      />
    </>
  );
}

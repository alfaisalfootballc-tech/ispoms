import { useState } from "react";
import { Plus, Calendar, Clock, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveBalanceCard } from "@/components/leave/LeaveBalanceCard";
import { LeaveRequestCard } from "@/components/leave/LeaveRequestCard";
import { RequestLeaveDialog } from "@/components/leave/RequestLeaveDialog";
import { useLeaveManagement } from "@/hooks/useLeaveManagement";
import { useAuth } from "@/contexts/AuthContext";

export default function Leave() {
  const { user, isAdmin, isManager } = useAuth();
  const { 
    leaveTypes, 
    balances, 
    requests, 
    pendingRequests, 
    myRequests,
    isLoading,
    canApprove 
  } = useLeaveManagement();
  const [showRequest, setShowRequest] = useState(false);
  const [activeTab, setActiveTab] = useState("my-requests");

  // Get requests for the approval queue (not the current user's)
  const approvalQueue = pendingRequests.filter((r) => r.user_id !== user?.id);

  // Calculate totals
  const totalAvailable = balances.reduce((sum, b) => {
    return sum + Math.max(0, b.total_days - b.used_days - b.pending_days);
  }, 0);

  const totalUsed = balances.reduce((sum, b) => sum + b.used_days, 0);
  const totalPending = balances.reduce((sum, b) => sum + b.pending_days, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
            <p className="text-muted-foreground">
              Request time off and track your leave balances
            </p>
          </div>
          <Button onClick={() => setShowRequest(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Days</p>
                  <p className="text-2xl font-bold">{totalAvailable}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold">{totalPending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Used This Year</p>
                  <p className="text-2xl font-bold">{totalUsed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Balances */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Leave Balances</h2>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : balances.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No leave balances found. Submit your first leave request to initialize your balances.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {balances.map((balance) => (
                <LeaveBalanceCard key={balance.id} balance={balance} />
              ))}
            </div>
          )}
        </div>

        {/* Leave Requests */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-requests">
              My Requests
              {myRequests.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {myRequests.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            {canApprove && (
              <TabsTrigger value="approval-queue">
                Approval Queue
                {approvalQueue.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {approvalQueue.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {(isAdmin || isManager) && (
              <TabsTrigger value="all-requests">All Requests</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-requests" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : myRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No leave requests yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Submit your first leave request to get started
                  </p>
                  <Button className="mt-4" onClick={() => setShowRequest(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Request Leave
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myRequests.map((request) => (
                  <LeaveRequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          {canApprove && (
            <TabsContent value="approval-queue" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : approvalQueue.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">No pending requests</h3>
                    <p className="text-muted-foreground mt-1">
                      All leave requests have been reviewed
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {approvalQueue.map((request) => (
                    <LeaveRequestCard key={request.id} request={request} showUser />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {(isAdmin || isManager) && (
            <TabsContent value="all-requests" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No leave requests found
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <LeaveRequestCard key={request.id} request={request} showUser />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Request Dialog */}
      <RequestLeaveDialog open={showRequest} onOpenChange={setShowRequest} />
    </DashboardLayout>
  );
}

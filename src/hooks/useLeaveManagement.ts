import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { differenceInBusinessDays, addDays } from "date-fns";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  color: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  referred_to_super_admin: boolean | null;
  referred_by: string | null;
  referred_at: string | null;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  reviewer?: {
    first_name: string | null;
    last_name: string | null;
  };
}
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  reviewer?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export function useLeaveManagement() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  // Fetch leave types
  const leaveTypesQuery = useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as LeaveType[];
    },
    enabled: !!user,
  });

  // Fetch user's leave balances
  const balancesQuery = useQuery({
    queryKey: ["leave-balances", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_balances")
        .select(`
          *,
          leave_type:leave_types(*)
        `)
        .eq("year", currentYear)
        .eq("user_id", user!.id);

      if (error) throw error;
      return data as LeaveBalance[];
    },
    enabled: !!user,
  });

  // Fetch leave requests
  const requestsQuery = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          *,
          leave_type:leave_types(*),
          user:profiles!leave_requests_user_id_fkey(first_name, last_name, email),
          reviewer:profiles!leave_requests_reviewed_by_fkey(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!user,
  });

  // Calculate days between dates (business days)
  const calculateDays = (startDate: Date, endDate: Date): number => {
    // Simple calculation including weekends for now
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Submit leave request
  const submitRequest = useMutation({
    mutationFn: async ({
      leaveTypeId,
      startDate,
      endDate,
      reason,
    }: {
      leaveTypeId: string;
      startDate: Date;
      endDate: Date;
      reason?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const daysCount = calculateDays(startDate, endDate);

      const { data, error } = await supabase
        .from("leave_requests")
        .insert({
          user_id: user.id,
          leave_type_id: leaveTypeId,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          days_count: daysCount,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      toast({
        title: "Leave request submitted",
        description: "Your request has been sent for approval.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message,
      });
    },
  });

  // Refer request to super admin
  const referToSuperAdmin = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("leave_requests")
        .update({
          referred_to_super_admin: true,
          referred_by: user.id,
          referred_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast({
        title: "Request referred",
        description: "The leave request has been referred to Super Admin for review.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Referral failed",
        description: error.message,
      });
    },
  });

  // Approve/Reject request
  const reviewRequest = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: "approved" | "rejected";
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("leave_requests")
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      toast({
        title: variables.status === "approved" ? "Request approved" : "Request rejected",
        description: `The leave request has been ${variables.status}.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Review failed",
        description: error.message,
      });
    },
  });

  // Cancel request
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      toast({
        title: "Request cancelled",
        description: "Your leave request has been cancelled.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Cancellation failed",
        description: error.message,
      });
    },
  });

  // Delete request
  const deleteRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("leave_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      toast({
        title: "Request deleted",
        description: "The leave request has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    },
  });

  // Get balance for a specific leave type
  const getBalance = (leaveTypeId: string) => {
    return balancesQuery.data?.find((b) => b.leave_type_id === leaveTypeId);
  };

  // Check if user can approve requests
  const canApprove = isAdmin;

  // Filter requests by status
  const pendingRequests = requestsQuery.data?.filter((r) => r.status === "pending") || [];
  const myRequests = requestsQuery.data?.filter((r) => r.user_id === user?.id) || [];

  return {
    leaveTypes: leaveTypesQuery.data || [],
    balances: balancesQuery.data || [],
    requests: requestsQuery.data || [],
    pendingRequests,
    myRequests,
    isLoading: leaveTypesQuery.isLoading || balancesQuery.isLoading || requestsQuery.isLoading,
    submitRequest,
    reviewRequest,
    referToSuperAdmin,
    cancelRequest,
    deleteRequest,
    getBalance,
    calculateDays,
    canApprove,
  };
}

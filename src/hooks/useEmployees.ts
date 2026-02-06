import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type EmployeeStatus = "active" | "on_leave" | "inactive";

export type Employee = Tables<"employees"> & {
  profile?: Tables<"profiles"> | null;
  department?: Tables<"departments"> | null;
};

export function useEmployees() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          profile:profiles(*),
          department:departments(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("employees-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employees",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["employees"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createEmployeeMutation = useMutation({
    mutationFn: async (employee: TablesInsert<"employees">) => {
      const { data, error } = await supabase
        .from("employees")
        .insert(employee)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add employee: " + error.message);
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"employees"> & { id: string }) => {
      const { data, error } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update employee: " + error.message);
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete employee: " + error.message);
    },
  });

  // Compute stats from live data
  const stats = {
    total: employeesQuery.data?.length || 0,
    active: employeesQuery.data?.filter((e) => e.status === "active").length || 0,
    onLeave: employeesQuery.data?.filter((e) => e.status === "on_leave").length || 0,
    inactive: employeesQuery.data?.filter((e) => e.status === "inactive").length || 0,
  };

  return {
    employees: employeesQuery.data || [],
    stats,
    isLoading: employeesQuery.isLoading,
    error: employeesQuery.error,
    createEmployee: createEmployeeMutation.mutateAsync,
    updateEmployee: updateEmployeeMutation.mutateAsync,
    deleteEmployee: deleteEmployeeMutation.mutateAsync,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isDeleting: deleteEmployeeMutation.isPending,
  };
}

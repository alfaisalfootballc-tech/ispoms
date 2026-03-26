import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Department = Tables<"departments"> & {
  manager?: Tables<"profiles"> | null;
  employee_count?: number;
};

export function useDepartments() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const departmentsQuery = useQuery({
    queryKey: ["departments-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select(`*, manager:profiles!departments_manager_id_fkey(*)`)
        .order("name");

      if (error) throw error;

      // Get employee counts per department
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("department_id");

      if (empError) throw empError;

      const counts: Record<string, number> = {};
      employees?.forEach((e) => {
        if (e.department_id) {
          counts[e.department_id] = (counts[e.department_id] || 0) + 1;
        }
      });

      return (data || []).map((d) => ({
        ...d,
        employee_count: counts[d.id] || 0,
      })) as Department[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: { name: string; description?: string; manager_id?: string | null }) => {
      const { error } = await supabase.from("departments").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-full"] });
      toast.success("Department created successfully");
    },
    onError: (error) => toast.error("Failed to create department: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name: string; description?: string; manager_id?: string | null }) => {
      const { error } = await supabase.from("departments").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-full"] });
      toast.success("Department updated successfully");
    },
    onError: (error) => toast.error("Failed to update department: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-full"] });
      toast.success("Department deleted successfully");
    },
    onError: (error) => toast.error("Failed to delete department: " + error.message),
  });

  // Fetch profiles for manager selection
  const managersQuery = useQuery({
    queryKey: ["profiles-for-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  return {
    departments: departmentsQuery.data || [],
    managers: managersQuery.data || [],
    isLoading: departmentsQuery.isLoading,
    createDepartment: createMutation.mutateAsync,
    updateDepartment: updateMutation.mutateAsync,
    deleteDepartment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type UserWithRole = Tables<"profiles"> & {
  role?: Tables<"user_roles">;
  department?: Tables<"departments"> | null;
};

export type AppRole = "super_admin" | "admin" | "employee";

export function useUserManagement() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users-management"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          department:departments(*)
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles separately
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles.map((profile) => ({
        ...profile,
        role: roles.find((r) => r.user_id === profile.id),
      }));

      return usersWithRoles as UserWithRole[];
    },
    enabled: isAdmin,
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update user role: " + error.message);
    },
  });

  const updateUserDepartmentMutation = useMutation({
    mutationFn: async ({ userId, departmentId }: { userId: string; departmentId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ department_id: departmentId })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      toast.success("User department updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update user department: " + error.message);
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Stats
  const stats = {
    total: usersQuery.data?.length || 0,
    superAdmins: usersQuery.data?.filter((u) => u.role?.role === "super_admin").length || 0,
    admins: usersQuery.data?.filter((u) => u.role?.role === "admin").length || 0,
    employees: usersQuery.data?.filter((u) => u.role?.role === "employee").length || 0,
  };

  return {
    users: usersQuery.data || [],
    departments: departmentsQuery.data || [],
    stats,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    updateUserRole: updateUserRoleMutation.mutateAsync,
    updateUserDepartment: updateUserDepartmentMutation.mutateAsync,
    isUpdating: updateUserRoleMutation.isPending || updateUserDepartmentMutation.isPending,
  };
}

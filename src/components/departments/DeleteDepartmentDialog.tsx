import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Department } from "@/hooks/useDepartments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function DeleteDepartmentDialog({ open, onOpenChange, department, onConfirm, isPending }: Props) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Department</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{department?.name}</strong>?
            {(department?.employee_count ?? 0) > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                This department has {department?.employee_count} employee(s). They will be unassigned.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

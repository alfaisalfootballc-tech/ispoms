import { useState, useEffect } from "react";
import { Share2, UserPlus, X, Shield, Eye, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Document, AccessLevel, useDocuments } from "@/hooks/useDocuments";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface AccessRecord {
  id: string;
  user_id: string;
  access_level: AccessLevel;
  user: Profile;
}

interface DocumentAccessDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getAccessIcon = (level: AccessLevel) => {
  switch (level) {
    case "admin":
      return Shield;
    case "edit":
      return Edit;
    default:
      return Eye;
  }
};

export function DocumentAccessDialog({ document, open, onOpenChange }: DocumentAccessDialogProps) {
  const { grantAccess, revokeAccess } = useDocuments();
  const { toast } = useToast();
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<AccessLevel>("view");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (document && open) {
      loadAccessRecords();
      loadUsers();
    }
  }, [document, open]);

  const loadAccessRecords = async () => {
    if (!document) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("document_access")
        .select(`
          id,
          user_id,
          access_level,
          user:profiles!document_access_user_id_fkey(id, email, first_name, last_name)
        `)
        .eq("document_id", document.id);

      if (error) throw error;
      setAccessRecords(data as unknown as AccessRecord[]);
    } catch (error) {
      console.error("Failed to load access records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .order("email");

      if (error) throw error;
      setAllUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleGrantAccess = async () => {
    if (!document || !selectedUser) return;

    await grantAccess.mutateAsync({
      documentId: document.id,
      userId: selectedUser,
      accessLevel: selectedLevel,
    });

    setSelectedUser("");
    setSelectedLevel("view");
    loadAccessRecords();
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!document) return;

    await revokeAccess.mutateAsync({
      documentId: document.id,
      userId,
    });

    loadAccessRecords();
  };

  const availableUsers = allUsers.filter(
    (user) =>
      user.id !== document?.uploaded_by &&
      !accessRecords.some((r) => r.user_id === user.id)
  );

  const getUserName = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Manage Access
          </DialogTitle>
          <DialogDescription>{document?.title}</DialogDescription>
        </DialogHeader>

        {/* Add User Section */}
        <div className="space-y-3">
          <Label>Grant Access to User</Label>
          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedLevel}
              onValueChange={(v) => setSelectedLevel(v as AccessLevel)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleGrantAccess}
              disabled={!selectedUser || grantAccess.isPending}
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Current Access List */}
        <div className="space-y-3">
          <Label>People with Access</Label>
          <ScrollArea className="max-h-[250px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : accessRecords.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No users have been granted access yet
              </div>
            ) : (
              <div className="space-y-2">
                {accessRecords.map((record) => {
                  const AccessIcon = getAccessIcon(record.access_level);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {record.user.first_name?.[0] || record.user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{getUserName(record.user)}</p>
                          <p className="text-xs text-muted-foreground">{record.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <AccessIcon className="w-3 h-3" />
                          {record.access_level}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRevokeAccess(record.user_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartConversation: (userId: string) => Promise<string | null>;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onStartConversation,
}: NewConversationDialogProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .neq("id", user?.id || "")
        .order("first_name");

      if (!error && data) {
        setUsers(data);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, [open, user?.id]);

  const filteredUsers = users.filter(
    (u) =>
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = async (userId: string) => {
    const result = await onStartConversation(userId);
    if (result) {
      setSearch("");
      onOpenChange(false);
    }
  };

  const getUserName = (profile: Profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.email.split("@")[0];
  };

  const getInitials = (profile: Profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile.email[0].toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Start a conversation with a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectUser(profile.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getUserName(profile)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

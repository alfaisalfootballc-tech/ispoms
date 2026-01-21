import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type DocumentStatus = "draft" | "published" | "archived";
export type AccessLevel = "view" | "edit" | "admin";

export interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: number;
  status: DocumentStatus;
  uploaded_by: string;
  department_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  uploader?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  change_notes: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentAccess {
  id: string;
  document_id: string;
  user_id: string;
  access_level: AccessLevel;
  granted_by: string;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export function useDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          uploader:profiles!documents_uploaded_by_fkey(first_name, last_name, email)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      title,
      description,
      category,
      isPublic,
      departmentId,
    }: {
      file: File;
      title: string;
      description?: string;
      category?: string;
      isPublic?: boolean;
      departmentId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title,
          description: description || null,
          category: category || null,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          is_public: isPublic || false,
          department_id: departmentId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial version record
      await supabase.from("document_versions").insert({
        document_id: data.id,
        version: 1,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        change_notes: "Initial upload",
        uploaded_by: user.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    },
  });

  const uploadNewVersion = useMutation({
    mutationFn: async ({
      documentId,
      file,
      changeNotes,
    }: {
      documentId: string;
      file: File;
      changeNotes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get current document
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("version")
        .eq("id", documentId)
        .single();

      if (docError) throw docError;

      const newVersion = doc.version + 1;

      // Upload new file
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_v${newVersion}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update document
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          version: newVersion,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .eq("id", documentId);

      if (updateError) throw updateError;

      // Create version record
      const { error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentId,
          version: newVersion,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          change_notes: changeNotes || null,
          uploaded_by: user.id,
        });

      if (versionError) throw versionError;

      return { documentId, newVersion };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "New version uploaded",
        description: "Document version has been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Version upload failed",
        description: error.message,
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // Get document to delete file from storage
      const { data: doc, error: fetchError } = await supabase
        .from("documents")
        .select("file_path")
        .eq("id", documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      await supabase.storage.from("documents").remove([doc.file_path]);

      // Delete document record (cascades to versions and access)
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been removed.",
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

  const updateDocument = useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      category,
      status,
      isPublic,
    }: {
      id: string;
      title?: string;
      description?: string;
      category?: string;
      status?: DocumentStatus;
      isPublic?: boolean;
    }) => {
      const { error } = await supabase
        .from("documents")
        .update({
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(status !== undefined && { status }),
          ...(isPublic !== undefined && { is_public: isPublic }),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    },
  });

  const getVersions = async (documentId: string) => {
    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version", { ascending: false });

    if (error) throw error;
    return data as DocumentVersion[];
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  const grantAccess = useMutation({
    mutationFn: async ({
      documentId,
      userId,
      accessLevel,
    }: {
      documentId: string;
      userId: string;
      accessLevel: AccessLevel;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("document_access").upsert({
        document_id: documentId,
        user_id: userId,
        access_level: accessLevel,
        granted_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-access"] });
      toast({
        title: "Access granted",
        description: "User access has been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to grant access",
        description: error.message,
      });
    },
  });

  const revokeAccess = useMutation({
    mutationFn: async ({
      documentId,
      userId,
    }: {
      documentId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("document_access")
        .delete()
        .eq("document_id", documentId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-access"] });
      toast({
        title: "Access revoked",
        description: "User access has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to revoke access",
        description: error.message,
      });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    uploadDocument,
    uploadNewVersion,
    deleteDocument,
    updateDocument,
    getVersions,
    getDocumentUrl,
    grantAccess,
    revokeAccess,
    uploadProgress,
  };
}

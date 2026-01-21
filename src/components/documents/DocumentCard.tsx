import { useState } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File, 
  MoreVertical, 
  Download, 
  Trash2, 
  Edit, 
  History, 
  Share2,
  Eye,
  Lock,
  Globe
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Document, useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentCardProps {
  document: Document;
  onEdit: (doc: Document) => void;
  onViewVersions: (doc: Document) => void;
  onShare: (doc: Document) => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("image")) return FileImage;
  return File;
};

const getFileIconColor = (mimeType: string) => {
  if (mimeType.includes("pdf")) return "text-red-500";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "text-green-500";
  if (mimeType.includes("image")) return "text-blue-500";
  if (mimeType.includes("word") || mimeType.includes("document")) return "text-blue-600";
  return "text-muted-foreground";
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "secondary";
  }
};

export function DocumentCard({ document, onEdit, onViewVersions, onShare }: DocumentCardProps) {
  const { user, isAdmin } = useAuth();
  const { deleteDocument, getDocumentUrl } = useDocuments();
  const [isDeleting, setIsDeleting] = useState(false);

  const FileIcon = getFileIcon(document.mime_type);
  const iconColor = getFileIconColor(document.mime_type);
  const isOwner = user?.id === document.uploaded_by;
  const canEdit = isOwner || isAdmin;

  const handleDownload = async () => {
    try {
      const url = await getDocumentUrl(document.file_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to get download URL:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setIsDeleting(true);
    await deleteDocument.mutateAsync(document.id);
    setIsDeleting(false);
  };

  const uploaderName = document.uploader
    ? `${document.uploader.first_name || ""} ${document.uploader.last_name || ""}`.trim() ||
      document.uploader.email
    : "Unknown";

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${iconColor}`}>
            <FileIcon className="w-6 h-6" />
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">{document.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{document.file_name}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewVersions(document)}>
                    <History className="w-4 h-4 mr-2" />
                    Version History
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(document)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onShare(document)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Manage Access
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={getStatusVariant(document.status)} className="text-[10px] h-5">
                {document.status}
              </Badge>
              {document.is_public ? (
                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                  <Globe className="w-3 h-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
              {document.category && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {document.category}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">v{document.version}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
              <span>{formatFileSize(document.file_size)}</span>
              <span>by {uploaderName}</span>
              <span>{format(new Date(document.updated_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

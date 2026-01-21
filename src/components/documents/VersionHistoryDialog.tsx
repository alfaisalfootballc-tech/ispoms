import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, Upload, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Document, DocumentVersion, useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/contexts/AuthContext";
import { UploadVersionDialog } from "./UploadVersionDialog";

interface VersionHistoryDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function VersionHistoryDialog({ document, open, onOpenChange }: VersionHistoryDialogProps) {
  const { user, isAdmin } = useAuth();
  const { getVersions, getDocumentUrl } = useDocuments();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadVersion, setShowUploadVersion] = useState(false);

  const isOwner = document && user?.id === document.uploaded_by;
  const canUploadVersion = isOwner || isAdmin;

  useEffect(() => {
    if (document && open) {
      loadVersions();
    }
  }, [document, open]);

  const loadVersions = async () => {
    if (!document) return;
    setIsLoading(true);
    try {
      const data = await getVersions(document.id);
      setVersions(data);
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadVersion = async (version: DocumentVersion) => {
    try {
      const url = await getDocumentUrl(version.file_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to get download URL:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </DialogTitle>
            <DialogDescription>
              {document?.title} - {versions.length} version{versions.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          {canUploadVersion && (
            <Button 
              onClick={() => setShowUploadVersion(true)} 
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Version
            </Button>
          )}

          <Separator />

          <ScrollArea className="max-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No version history available
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border ${
                      index === 0 ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            Version {version.version}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {version.file_name} • {formatFileSize(version.file_size)}
                        </p>
                        {version.change_notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{version.change_notes}"
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownloadVersion(version)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {document && (
        <UploadVersionDialog
          document={document}
          open={showUploadVersion}
          onOpenChange={(open) => {
            setShowUploadVersion(open);
            if (!open) loadVersions();
          }}
        />
      )}
    </>
  );
}

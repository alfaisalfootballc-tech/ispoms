import { useState } from "react";
import { Plus, Search, Filter, FileText, FolderOpen, Grid, List } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { VersionHistoryDialog } from "@/components/documents/VersionHistoryDialog";
import { DocumentAccessDialog } from "@/components/documents/DocumentAccessDialog";
import { EditDocumentDialog } from "@/components/documents/EditDocumentDialog";
import { Document, useDocuments } from "@/hooks/useDocuments";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  "All",
  "Policy",
  "Procedure",
  "Template",
  "Report",
  "Contract",
  "Training",
  "HR",
  "Finance",
  "IT",
  "Other",
];

export default function Documents() {
  const { documents, isLoading } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Dialog states
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setShowEdit(true);
  };

  const handleViewVersions = (doc: Document) => {
    setSelectedDocument(doc);
    setShowVersions(true);
  };

  const handleShare = (doc: Document) => {
    setSelectedDocument(doc);
    setShowAccess(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Manage and organize your documents with version control
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            {documents.length} Total
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {documents.filter((d) => d.status === "published").length} Published
          </Badge>
          <Badge variant="outline" className="gap-1">
            {documents.filter((d) => d.status === "draft").length} Drafts
          </Badge>
        </div>

        {/* Documents Grid/List */}
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              {searchQuery || selectedCategory !== "All" || selectedStatus !== "all"
                ? "Try adjusting your filters or search query"
                : "Upload your first document to get started"}
            </p>
            {!searchQuery && selectedCategory === "All" && selectedStatus === "all" && (
              <Button className="mt-4" onClick={() => setShowUpload(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onEdit={handleEdit}
                onViewVersions={handleViewVersions}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UploadDocumentDialog open={showUpload} onOpenChange={setShowUpload} />
      
      <VersionHistoryDialog
        document={selectedDocument}
        open={showVersions}
        onOpenChange={setShowVersions}
      />
      
      <DocumentAccessDialog
        document={selectedDocument}
        open={showAccess}
        onOpenChange={setShowAccess}
      />
      
      <EditDocumentDialog
        document={selectedDocument}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </DashboardLayout>
  );
}

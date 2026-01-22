import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Bold, Italic, List, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Announcement, AnnouncementPriority, useAnnouncements } from "@/hooks/useAnnouncements";

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAnnouncement?: Announcement | null;
}

export function CreateAnnouncementDialog({ 
  open, 
  onOpenChange, 
  editingAnnouncement 
}: CreateAnnouncementDialogProps) {
  const { departments, createAnnouncement, updateAnnouncement } = useAnnouncements();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [targetAll, setTargetAll] = useState(true);
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [publishedAt, setPublishedAt] = useState<Date>();
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date>();

  const isEditing = !!editingAnnouncement;

  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title);
      setContent(editingAnnouncement.content);
      setExcerpt(editingAnnouncement.excerpt || "");
      setPriority(editingAnnouncement.priority);
      setIsPinned(editingAnnouncement.is_pinned);
      setTargetAll(editingAnnouncement.target_all);
      setTargetDepartmentId(editingAnnouncement.target_department_id || "");
      
      if (editingAnnouncement.published_at) {
        const pubDate = new Date(editingAnnouncement.published_at);
        setPublishNow(pubDate <= new Date());
        setPublishedAt(pubDate > new Date() ? pubDate : undefined);
      }
      
      if (editingAnnouncement.expires_at) {
        setHasExpiry(true);
        setExpiresAt(new Date(editingAnnouncement.expires_at));
      }
    } else {
      resetForm();
    }
  }, [editingAnnouncement, open]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setExcerpt("");
    setPriority("normal");
    setIsPinned(false);
    setTargetAll(true);
    setTargetDepartmentId("");
    setPublishNow(true);
    setPublishedAt(undefined);
    setHasExpiry(false);
    setExpiresAt(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const data = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || undefined,
      priority,
      isPinned,
      targetAll,
      targetDepartmentId: targetAll ? undefined : targetDepartmentId,
      publishedAt: publishNow ? new Date() : publishedAt,
      expiresAt: hasExpiry ? expiresAt : undefined,
    };

    if (isEditing) {
      await updateAnnouncement.mutateAsync({ id: editingAnnouncement.id, ...data });
    } else {
      await createAnnouncement.mutateAsync(data);
    }

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update announcement details" : "Create a new announcement for your organization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              required
            />
          </div>

          {/* Content with simple formatting toolbar */}
          <div className="space-y-2">
            <Label>Content *</Label>
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setContent((c) => c + "**bold**")}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setContent((c) => c + "*italic*")}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setContent((c) => c + "\n- List item")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setContent((c) => c + "[link text](url)")}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement content here... (Markdown supported)"
                className="border-0 rounded-none min-h-[150px] focus-visible:ring-0"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supports Markdown formatting: **bold**, *italic*, - lists, [links](url)
            </p>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (Preview text)</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary shown in announcement cards..."
              rows={2}
            />
          </div>

          {/* Priority and Pin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as AnnouncementPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between pt-8">
              <Label htmlFor="pinned">Pin to top</Label>
              <Switch
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-3">
            <Label>Target Audience</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">All staff members</span>
              <Switch
                checked={targetAll}
                onCheckedChange={setTargetAll}
              />
            </div>
            
            {!targetAll && (
              <Select value={targetDepartmentId} onValueChange={setTargetDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Publishing */}
          <div className="space-y-3">
            <Label>Publishing</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Publish immediately</span>
              <Switch
                checked={publishNow}
                onCheckedChange={setPublishNow}
              />
            </div>
            
            {!publishNow && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !publishedAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {publishedAt ? format(publishedAt, "PPP 'at' p") : "Schedule publish date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={publishedAt}
                    onSelect={setPublishedAt}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Expiry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Set expiry date</Label>
              <Switch
                checked={hasExpiry}
                onCheckedChange={setHasExpiry}
              />
            </div>
            
            {hasExpiry && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiresAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiresAt ? format(expiresAt, "PPP") : "Select expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title.trim() ||
                !content.trim() ||
                createAnnouncement.isPending ||
                updateAnnouncement.isPending
              }
            >
              {createAnnouncement.isPending || updateAnnouncement.isPending
                ? "Saving..."
                : isEditing
                ? "Update"
                : publishNow
                ? "Publish"
                : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

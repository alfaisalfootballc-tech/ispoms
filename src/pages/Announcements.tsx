import { useState } from "react";
import { Plus, Megaphone, Bell, Clock, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { CreateAnnouncementDialog } from "@/components/announcements/CreateAnnouncementDialog";
import { ViewAnnouncementDialog } from "@/components/announcements/ViewAnnouncementDialog";
import { Announcement, useAnnouncements } from "@/hooks/useAnnouncements";

export default function Announcements() {
  const { 
    publishedAnnouncements, 
    draftAnnouncements,
    unreadCount,
    isLoading,
    canCreate 
  } = useAnnouncements();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  
  const [showCreate, setShowCreate] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

  // Filter announcements
  const filterAnnouncements = (announcements: Announcement[]) => {
    return announcements.filter((a) => {
      const matchesSearch = 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === "all" || a.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    });
  };

  const filteredPublished = filterAnnouncements(publishedAnnouncements);
  const filteredDrafts = filterAnnouncements(draftAnnouncements);
  const unreadAnnouncements = filteredPublished.filter((a) => !a.is_read);
  const pinnedAnnouncements = filteredPublished.filter((a) => a.is_pinned);

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowCreate(true);
  };

  const handleView = (announcement: Announcement) => {
    setViewingAnnouncement(announcement);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">
              Stay updated with the latest company news and updates
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => {
              setEditingAnnouncement(null);
              setShowCreate(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Announcements</p>
                  <p className="text-2xl font-bold">{publishedAnnouncements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Bell className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canCreate && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled/Drafts</p>
                    <p className="text-2xl font-bold">{draftAnnouncements.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {filteredPublished.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadAnnouncements.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadAnnouncements.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pinned">
              Pinned
              <Badge variant="secondary" className="ml-2">
                {pinnedAnnouncements.length}
              </Badge>
            </TabsTrigger>
            {canCreate && (
              <TabsTrigger value="drafts">
                Drafts
                <Badge variant="secondary" className="ml-2">
                  {filteredDrafts.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : filteredPublished.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No announcements</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchQuery || priorityFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Check back later for updates"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPublished.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onView={handleView}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            {unreadAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">All caught up!</h3>
                  <p className="text-muted-foreground mt-1">
                    You've read all announcements
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {unreadAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onView={handleView}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pinned" className="mt-4">
            {pinnedAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pinned announcements
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onView={handleView}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {canCreate && (
            <TabsContent value="drafts" className="mt-4">
              {filteredDrafts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">No drafts or scheduled</h3>
                    <p className="text-muted-foreground mt-1">
                      Create a new announcement to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredDrafts.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onEdit={handleEdit}
                      onView={handleView}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateAnnouncementDialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setEditingAnnouncement(null);
        }}
        editingAnnouncement={editingAnnouncement}
      />

      <ViewAnnouncementDialog
        announcement={viewingAnnouncement}
        open={!!viewingAnnouncement}
        onOpenChange={(open) => {
          if (!open) setViewingAnnouncement(null);
        }}
      />
    </DashboardLayout>
  );
}

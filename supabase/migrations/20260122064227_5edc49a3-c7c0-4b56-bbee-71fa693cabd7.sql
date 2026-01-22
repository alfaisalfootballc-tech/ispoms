-- Create announcement priority enum
CREATE TYPE public.announcement_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    priority announcement_priority NOT NULL DEFAULT 'normal',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    target_all BOOLEAN NOT NULL DEFAULT true,
    target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcement read tracking table
CREATE TABLE public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can view announcement
CREATE OR REPLACE FUNCTION public.can_view_announcement(_announcement_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = _announcement_id
    AND (
      -- Published and not expired
      a.published_at IS NOT NULL 
      AND a.published_at <= now()
      AND (a.expires_at IS NULL OR a.expires_at > now())
    )
    AND (
      -- Target all or user's department or admin/manager
      a.target_all = true
      OR a.target_department_id = public.get_user_department_id()
      OR public.is_admin()
      OR public.is_manager()
    )
  )
  OR public.is_admin()
  OR (
    -- Creator can always view their own
    SELECT created_by = _user_id FROM public.announcements WHERE id = _announcement_id
  )
$$;

-- Announcements policies
CREATE POLICY "Users can view published announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (
  public.can_view_announcement(id, auth.uid())
);

CREATE POLICY "Admins and managers can create announcements"
ON public.announcements FOR INSERT
TO authenticated
WITH CHECK (
  (public.is_admin() OR public.is_manager())
  AND created_by = auth.uid()
);

CREATE POLICY "Creators can update their announcements"
ON public.announcements FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can delete any announcement"
ON public.announcements FOR DELETE
TO authenticated
USING (public.is_admin() OR created_by = auth.uid());

-- Announcement reads policies
CREATE POLICY "Users can view their own read status"
ON public.announcement_reads FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark announcements as read"
ON public.announcement_reads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their read status"
ON public.announcement_reads FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
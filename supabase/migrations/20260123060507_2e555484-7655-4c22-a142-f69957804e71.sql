-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'in_review', 'completed');

-- Create task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status public.task_status NOT NULL DEFAULT 'todo',
    priority public.task_priority NOT NULL DEFAULT 'medium',
    due_date DATE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_department_id ON public.tasks(department_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Users can view tasks they created or are assigned to
CREATE POLICY "Users can view own tasks"
ON public.tasks
FOR SELECT
USING (
    created_by = auth.uid() 
    OR assigned_to = auth.uid()
);

-- Managers can view all tasks in their department
CREATE POLICY "Managers can view department tasks"
ON public.tasks
FOR SELECT
USING (
    public.is_manager() 
    AND department_id = public.get_user_department_id()
);

-- Admins can view all tasks
CREATE POLICY "Admins can view all tasks"
ON public.tasks
FOR SELECT
USING (public.is_admin());

-- Users can create tasks
CREATE POLICY "Authenticated users can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Users can update tasks they created or are assigned to
CREATE POLICY "Users can update own tasks"
ON public.tasks
FOR UPDATE
USING (
    created_by = auth.uid() 
    OR assigned_to = auth.uid()
);

-- Managers can update department tasks
CREATE POLICY "Managers can update department tasks"
ON public.tasks
FOR UPDATE
USING (
    public.is_manager() 
    AND department_id = public.get_user_department_id()
);

-- Admins can update all tasks
CREATE POLICY "Admins can update all tasks"
ON public.tasks
FOR UPDATE
USING (public.is_admin());

-- Users can delete tasks they created
CREATE POLICY "Users can delete own tasks"
ON public.tasks
FOR DELETE
USING (created_by = auth.uid());

-- Admins can delete any task
CREATE POLICY "Admins can delete any task"
ON public.tasks
FOR DELETE
USING (public.is_admin());

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
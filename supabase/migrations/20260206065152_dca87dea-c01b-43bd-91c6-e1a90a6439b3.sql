-- Create employee status enum
CREATE TYPE public.employee_status AS ENUM ('active', 'on_leave', 'inactive');

-- Create employees table with profile linkage
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_number TEXT UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    job_title TEXT,
    status public.employee_status NOT NULL DEFAULT 'active',
    phone TEXT,
    location TEXT,
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view employees" 
ON public.employees 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage employees" 
ON public.employees 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Managers can update department employees" 
ON public.employees 
FOR UPDATE 
USING (public.is_manager() AND department_id = public.get_user_department_id());

-- Update trigger
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for employees table
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
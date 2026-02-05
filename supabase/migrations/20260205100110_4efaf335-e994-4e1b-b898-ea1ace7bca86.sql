-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'remote', 'half_day', 'absent');

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  status attendance_status NOT NULL DEFAULT 'present',
  clock_in_location JSONB,
  clock_out_location JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user can view attendance
CREATE OR REPLACE FUNCTION public.can_view_attendance(_user_id uuid, _record_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _user_id = _record_user_id
    OR public.is_admin()
    OR (public.is_manager() AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _record_user_id 
      AND p.department_id = public.get_user_department_id()
    ))
$$;

-- RLS Policies
CREATE POLICY "Users can view their own attendance"
ON public.attendance_records
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view department attendance"
ON public.attendance_records
FOR SELECT
USING (
  public.is_manager() AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = attendance_records.user_id 
    AND p.department_id = public.get_user_department_id()
  )
);

CREATE POLICY "Admins can view all attendance"
ON public.attendance_records
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Users can clock in/out"
ON public.attendance_records
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance"
ON public.attendance_records
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can update any attendance"
ON public.attendance_records
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete attendance"
ON public.attendance_records
FOR DELETE
USING (public.is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_records_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_attendance_records_user_date ON public.attendance_records(user_id, date);
CREATE INDEX idx_attendance_records_date ON public.attendance_records(date);
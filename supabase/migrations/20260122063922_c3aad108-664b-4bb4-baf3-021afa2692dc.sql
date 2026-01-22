-- Create leave request status enum
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Create leave types table
CREATE TABLE public.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    days_per_year INTEGER NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT true,
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave balances table
CREATE TABLE public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    total_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    used_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    pending_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, leave_type_id, year)
);

-- Create leave requests table
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC(5,2) NOT NULL,
    reason TEXT,
    status leave_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Leave types policies (everyone can view, only admins can modify)
CREATE POLICY "Everyone can view leave types"
ON public.leave_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage leave types"
ON public.leave_types FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Leave balances policies
CREATE POLICY "Users can view their own balances"
ON public.leave_balances FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can view department balances"
ON public.leave_balances FOR SELECT
TO authenticated
USING (
    public.is_manager() AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = leave_balances.user_id
        AND p.department_id = public.get_user_department_id()
    )
);

CREATE POLICY "Admins can view all balances"
ON public.leave_balances FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage balances"
ON public.leave_balances FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Leave requests policies
CREATE POLICY "Users can view their own requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can view department requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (
    public.is_manager() AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = leave_requests.user_id
        AND p.department_id = public.get_user_department_id()
    )
);

CREATE POLICY "Admins can view all requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can create their own requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Managers can update department requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (
    public.is_manager() AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = leave_requests.user_id
        AND p.department_id = public.get_user_department_id()
    )
);

CREATE POLICY "Admins can update any request"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can delete their pending requests"
ON public.leave_requests FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

-- Triggers for updated_at
CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default leave types
INSERT INTO public.leave_types (name, description, days_per_year, is_paid, color) VALUES
('Annual Leave', 'Standard paid annual leave', 20, true, '#3b82f6'),
('Sick Leave', 'Paid sick leave for medical reasons', 10, true, '#ef4444'),
('Personal Leave', 'Personal time off for various needs', 5, true, '#8b5cf6'),
('Unpaid Leave', 'Leave without pay', 0, false, '#6b7280'),
('Maternity Leave', 'Maternity leave for new mothers', 90, true, '#ec4899'),
('Paternity Leave', 'Paternity leave for new fathers', 10, true, '#06b6d4'),
('Bereavement Leave', 'Leave for family bereavement', 5, true, '#374151'),
('Study Leave', 'Leave for educational purposes', 5, true, '#f59e0b');

-- Function to update leave balance on request status change
CREATE OR REPLACE FUNCTION public.update_leave_balance_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_year INTEGER;
BEGIN
    request_year := EXTRACT(YEAR FROM NEW.start_date);
    
    -- Ensure balance record exists
    INSERT INTO public.leave_balances (user_id, leave_type_id, year, total_days)
    SELECT NEW.user_id, NEW.leave_type_id, request_year, lt.days_per_year
    FROM public.leave_types lt
    WHERE lt.id = NEW.leave_type_id
    ON CONFLICT (user_id, leave_type_id, year) DO NOTHING;
    
    -- Handle status transitions
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        UPDATE public.leave_balances
        SET pending_days = pending_days + NEW.days_count
        WHERE user_id = NEW.user_id 
        AND leave_type_id = NEW.leave_type_id 
        AND year = request_year;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- From pending to approved
        IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
            UPDATE public.leave_balances
            SET pending_days = pending_days - NEW.days_count,
                used_days = used_days + NEW.days_count
            WHERE user_id = NEW.user_id 
            AND leave_type_id = NEW.leave_type_id 
            AND year = request_year;
            
        -- From pending to rejected/cancelled
        ELSIF OLD.status = 'pending' AND NEW.status IN ('rejected', 'cancelled') THEN
            UPDATE public.leave_balances
            SET pending_days = pending_days - OLD.days_count
            WHERE user_id = NEW.user_id 
            AND leave_type_id = NEW.leave_type_id 
            AND year = request_year;
            
        -- From approved to cancelled (refund)
        ELSIF OLD.status = 'approved' AND NEW.status = 'cancelled' THEN
            UPDATE public.leave_balances
            SET used_days = used_days - OLD.days_count
            WHERE user_id = NEW.user_id 
            AND leave_type_id = NEW.leave_type_id 
            AND year = request_year;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to update balances
CREATE TRIGGER on_leave_request_change
  AFTER INSERT OR UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_leave_balance_on_request();
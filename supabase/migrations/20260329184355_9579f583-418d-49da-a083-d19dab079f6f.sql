-- Fix is_admin() to include both super_admin AND admin roles
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin') 
      OR public.has_role(auth.uid(), 'admin')
$$;

-- Fix is_manager() to also include super_admin
CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
$$;

-- Recreate the leave balance trigger (it may be missing)
DROP TRIGGER IF EXISTS leave_request_balance_trigger ON public.leave_requests;
CREATE TRIGGER leave_request_balance_trigger
  AFTER INSERT OR UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leave_balance_on_request();
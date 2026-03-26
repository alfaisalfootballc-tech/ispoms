
-- Rename enum values: order matters to avoid conflicts
-- First rename 'admin' to 'super_admin' (so 'admin' is free for manager)
ALTER TYPE public.app_role RENAME VALUE 'admin' TO 'super_admin';
-- Then rename 'manager' to 'admin'
ALTER TYPE public.app_role RENAME VALUE 'manager' TO 'admin';
-- Then rename 'staff' to 'employee'
ALTER TYPE public.app_role RENAME VALUE 'staff' TO 'employee';

-- Update the handle_new_user function to default to 'employee'
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee')
  );
  
  RETURN NEW;
END;
$function$;

-- Update is_admin to check super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'super_admin')
$function$;

-- Update is_manager to check admin role
CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin')
$function$;

-- Update is_staff to check employee role
CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'employee')
$function$;

-- Update default for user_roles.role column
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'employee'::app_role;

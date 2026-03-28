-- Add escalation columns to leave_requests
ALTER TABLE public.leave_requests 
  ADD COLUMN IF NOT EXISTS referred_to_super_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS referred_at timestamptz;

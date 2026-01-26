-- Add assigned_to_admin_id column for forwarding applications to specific admins
ALTER TABLE public.booster_applications 
ADD COLUMN assigned_to_admin_id uuid REFERENCES auth.users(id),
ADD COLUMN assigned_at timestamp with time zone,
ADD COLUMN assigned_by uuid REFERENCES auth.users(id);
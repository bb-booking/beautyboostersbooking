-- Opret tabel til booster ansøgninger
CREATE TABLE IF NOT EXISTS public.booster_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  business_type TEXT,
  cvr_number TEXT,
  cpr_number TEXT,
  address TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  work_radius INTEGER DEFAULT 50,
  primary_transport TEXT,
  education JSONB,
  years_experience INTEGER DEFAULT 1,
  portfolio_links TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  rejection_reason TEXT
);

-- Enable RLS
ALTER TABLE public.booster_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own application
CREATE POLICY "Users can view their own booster application"
ON public.booster_applications FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Applicants can create their own application
CREATE POLICY "Users can create booster application"
ON public.booster_applications FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Applicants can update their pending application
CREATE POLICY "Users can update their pending application"
ON public.booster_applications FOR UPDATE
USING (user_id = auth.uid() AND status = 'pending');

-- Admins can manage all applications
CREATE POLICY "Admins can manage booster applications"
ON public.booster_applications FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_booster_applications_updated_at
BEFORE UPDATE ON public.booster_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create job_booster_assignments table to support multiple boosters per job
CREATE TABLE public.job_booster_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES public.booster_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by TEXT,
  notes TEXT,
  UNIQUE(job_id, booster_id)
);

-- Enable RLS
ALTER TABLE public.job_booster_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (same as jobs table)
CREATE POLICY "Allow all operations on job_booster_assignments"
ON public.job_booster_assignments
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_job_booster_assignments_job_id ON public.job_booster_assignments(job_id);
CREATE INDEX idx_job_booster_assignments_booster_id ON public.job_booster_assignments(booster_id);

-- Migrate existing assigned_booster_id data to the new table
INSERT INTO public.job_booster_assignments (job_id, booster_id, assigned_by)
SELECT id, assigned_booster_id, 'system_migration'
FROM public.jobs
WHERE assigned_booster_id IS NOT NULL;
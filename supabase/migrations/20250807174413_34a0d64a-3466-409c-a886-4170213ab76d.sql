-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  location TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  hourly_rate INTEGER NOT NULL,
  date_needed DATE NOT NULL,
  time_needed TIME,
  duration_hours INTEGER,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_booster_id UUID,
  created_by TEXT, -- admin user who created the job
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES public.booster_profiles(id) ON DELETE CASCADE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  UNIQUE(job_id, booster_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.booster_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'job_notification' CHECK (type IN ('job_notification', 'job_assigned', 'job_update', 'system')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs
CREATE POLICY "Allow all operations on jobs" 
ON public.jobs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for job applications
CREATE POLICY "Allow all operations on job applications" 
ON public.job_applications 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for notifications
CREATE POLICY "Allow all operations on notifications" 
ON public.notifications 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify boosters about new jobs
CREATE OR REPLACE FUNCTION public.notify_relevant_boosters()
RETURNS trigger AS $$
BEGIN
  -- Insert notifications for boosters matching the job criteria
  INSERT INTO public.notifications (recipient_id, job_id, title, message, type)
  SELECT 
    bp.id,
    NEW.id,
    'Nyt job tilgængeligt: ' || NEW.title,
    'Et nyt job i ' || NEW.location || ' er tilgængeligt. Timepris: ' || NEW.hourly_rate || ' DKK',
    'job_notification'
  FROM public.booster_profiles bp
  WHERE 
    bp.location = NEW.location
    AND bp.is_available = true
    AND (
      NEW.required_skills = '{}' 
      OR bp.specialties && NEW.required_skills
    );
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-notify boosters when job is created
CREATE TRIGGER trigger_notify_boosters
AFTER INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.notify_relevant_boosters();
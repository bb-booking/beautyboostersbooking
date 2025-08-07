-- Create job_services table for multiple services per job
CREATE TABLE IF NOT EXISTS job_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  service_id text NOT NULL,
  service_name text NOT NULL,
  service_price integer NOT NULL,
  people_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- Create competence_tags table
CREATE TABLE IF NOT EXISTS competence_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create job_competence_tags table for many-to-many relationship
CREATE TABLE IF NOT EXISTS job_competence_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  competence_tag_id uuid REFERENCES competence_tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(job_id, competence_tag_id)
);

-- Create job_communications table for secure customer-booster communication
CREATE TABLE IF NOT EXISTS job_communications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'booster', 'admin')),
  message_text text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

-- Insert default competence tags
INSERT INTO competence_tags (name, category) VALUES
  ('Bryllupsmakeup', 'Makeup'),
  ('Fotoshoot makeup', 'Makeup'),
  ('Event makeup', 'Makeup'),
  ('SFX makeup', 'Makeup'),
  ('Fashion makeup', 'Makeup'),
  ('Editorial makeup', 'Makeup'),
  ('Hår styling', 'Hår'),
  ('Hår opsætning', 'Hår'),
  ('Konfirmation', 'Events'),
  ('Børn makeup', 'Specialer'),
  ('Spraytan', 'Behandlinger'),
  ('Makeup undervisning', 'Undervisning'),
  ('Parykdesign', 'Specialer'),
  ('Film/TV makeup', 'Specialer')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE job_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE competence_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_competence_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on job_services" ON job_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Competence tags are viewable by everyone" ON competence_tags FOR SELECT USING (true);
CREATE POLICY "Allow all operations on job_competence_tags" ON job_competence_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on job_communications" ON job_communications FOR ALL USING (true) WITH CHECK (true);

-- Update the notification function to include service details and exclude customer contact info
CREATE OR REPLACE FUNCTION public.notify_relevant_boosters()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert notifications for boosters matching the job criteria
  INSERT INTO public.notifications (recipient_id, job_id, title, message, type)
  SELECT 
    bp.id,
    NEW.id,
    'Nyt job tilgængeligt: ' || NEW.title,
    'Service: ' || NEW.service_type || 
    ' | Lokation: ' || NEW.location || 
    ' | Dato: ' || NEW.date_needed ||
    CASE 
      WHEN NEW.time_needed IS NOT NULL THEN ' kl. ' || NEW.time_needed 
      ELSE '' 
    END ||
    ' | Pris: ' || NEW.hourly_rate || ' DKK' ||
    CASE 
      WHEN NEW.client_type = 'privat' THEN ' (inkl. moms)' 
      ELSE ' (ex. moms)' 
    END ||
    CASE 
      WHEN NEW.boosters_needed > 1 THEN ' | ' || NEW.boosters_needed || ' boosters søges'
      ELSE ''
    END,
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
$function$;
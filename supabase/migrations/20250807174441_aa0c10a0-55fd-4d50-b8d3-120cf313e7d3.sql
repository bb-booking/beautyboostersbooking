-- Fix security warnings for functions by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_relevant_boosters()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;
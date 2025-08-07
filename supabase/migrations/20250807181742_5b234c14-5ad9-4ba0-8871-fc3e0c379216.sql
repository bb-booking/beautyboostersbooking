-- Create booster_availability table for calendar management
CREATE TABLE IF NOT EXISTS booster_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booster_id uuid REFERENCES booster_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'vacation', 'sick')),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(booster_id, date, start_time)
);

-- Create indexes for better performance
CREATE INDEX idx_booster_availability_booster_date ON booster_availability(booster_id, date);
CREATE INDEX idx_booster_availability_date ON booster_availability(date);
CREATE INDEX idx_booster_availability_status ON booster_availability(status);

-- Enable RLS
ALTER TABLE booster_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on booster_availability" ON booster_availability FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_booster_availability_updated_at
BEFORE UPDATE ON booster_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
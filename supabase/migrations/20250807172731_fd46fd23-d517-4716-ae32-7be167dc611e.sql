-- Create inquiries table
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  navn TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT,
  firma TEXT,
  service_id TEXT,
  service_navn TEXT,
  projekt_type TEXT,
  budget TEXT,
  tidslinje TEXT,
  beskrivelse TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ny' CHECK (status IN ('ny', 'under_behandling', 'afsluttet')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (no user authentication required for this table)
CREATE POLICY "Allow all operations on inquiries" 
ON public.inquiries 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
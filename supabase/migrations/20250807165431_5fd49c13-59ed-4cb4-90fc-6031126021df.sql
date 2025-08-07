-- Create inquiries table to store all form submissions
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT,
  navn TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT NOT NULL,
  virksomhed TEXT,
  projekt_type TEXT,
  start_dato DATE,
  slut_dato DATE,
  lokation TEXT,
  antal_personer INTEGER,
  budget TEXT,
  beskrivelse TEXT NOT NULL,
  specielle_krav TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies - for now allowing all authenticated users to read
-- In a real app, you'd want role-based access control
CREATE POLICY "Anyone can insert inquiries" 
ON public.inquiries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view inquiries" 
ON public.inquiries 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inquiries" 
ON public.inquiries 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
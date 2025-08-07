-- Create invoices table for tracking sent invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  economic_invoice_id integer,
  invoice_number text,
  customer_name text NOT NULL,
  customer_email text,
  amount decimal(10,2) NOT NULL,
  vat_amount decimal(10,2) NOT NULL DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'DKK',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at timestamp with time zone,
  due_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add invoice fields to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_sent boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id);
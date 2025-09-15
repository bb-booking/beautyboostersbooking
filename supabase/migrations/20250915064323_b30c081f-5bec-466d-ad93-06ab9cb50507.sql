-- Create Shopify orders integration table
CREATE TABLE public.shopify_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_order_id BIGINT NOT NULL UNIQUE,
  shopify_order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_name TEXT NOT NULL,
  service_details JSONB DEFAULT '{}',
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DKK',
  financial_status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT,
  booking_date DATE,
  booking_time TIME,
  location TEXT,
  special_requests TEXT,
  order_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_booster_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopify_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for Shopify bookings
CREATE POLICY "Admins can manage Shopify bookings" 
ON public.shopify_bookings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create webhook logs table for debugging
CREATE TABLE public.shopify_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_topic TEXT NOT NULL,
  shopify_order_id BIGINT,
  webhook_data JSONB NOT NULL,
  processed_successfully BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopify_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook logs
CREATE POLICY "Admins can view webhook logs" 
ON public.shopify_webhook_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_shopify_bookings_updated_at
BEFORE UPDATE ON public.shopify_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_shopify_bookings_order_id ON public.shopify_bookings(shopify_order_id);
CREATE INDEX idx_shopify_bookings_status ON public.shopify_bookings(status);
CREATE INDEX idx_shopify_bookings_created_at ON public.shopify_bookings(created_at);
CREATE INDEX idx_webhook_logs_topic ON public.shopify_webhook_logs(webhook_topic);
CREATE INDEX idx_webhook_logs_created_at ON public.shopify_webhook_logs(created_at);
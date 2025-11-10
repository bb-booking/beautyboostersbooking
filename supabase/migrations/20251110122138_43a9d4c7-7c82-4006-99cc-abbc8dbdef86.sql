-- Create table for synced Shopify products
CREATE TABLE IF NOT EXISTS public.shopify_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_product_id bigint NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  product_type text,
  vendor text,
  price numeric NOT NULL,
  compare_at_price numeric,
  images jsonb DEFAULT '[]'::jsonb,
  variants jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  shopify_handle text,
  shopify_url text,
  sync_status text NOT NULL DEFAULT 'synced',
  last_synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopify_products ENABLE ROW LEVEL SECURITY;

-- Allow public to view active products
CREATE POLICY "Anyone can view active Shopify products"
ON public.shopify_products
FOR SELECT
USING (status = 'active');

-- Admins can manage all products
CREATE POLICY "Admins can manage Shopify products"
ON public.shopify_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_shopify_products_shopify_id ON public.shopify_products(shopify_product_id);
CREATE INDEX idx_shopify_products_status ON public.shopify_products(status);

-- Add updated_at trigger
CREATE TRIGGER update_shopify_products_updated_at
BEFORE UPDATE ON public.shopify_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
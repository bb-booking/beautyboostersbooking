-- Discount codes + bookings columns migration

-- 1) Discount codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percent','fixed')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DKK',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  max_redemptions INTEGER,
  per_user_limit INTEGER,
  min_amount NUMERIC NOT NULL DEFAULT 0,
  salon_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique code
CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_codes_code_lower ON public.discount_codes (lower(code));

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active and valid codes"
ON public.discount_codes
FOR SELECT
USING (
  active = TRUE
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_to IS NULL OR valid_to >= now())
);

CREATE POLICY "Admins can manage discount codes"
ON public.discount_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Salon owners can manage their discount codes"
ON public.discount_codes
FOR ALL
USING (salon_id IS NOT NULL AND public.has_salon_access(salon_id))
WITH CHECK (salon_id IS NOT NULL AND public.has_salon_access(salon_id));

-- updated_at trigger
DROP TRIGGER IF EXISTS set_discount_codes_updated_at ON public.discount_codes;
CREATE TRIGGER set_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Bookings: store applied discount
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0;
-- Create helper function to check salon access
CREATE OR REPLACE FUNCTION public.has_salon_access(_salon_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salon_profiles sp
    WHERE sp.id = _salon_id AND sp.owner_user_id = auth.uid()
  );
$$;

-- Employees table
CREATE TABLE IF NOT EXISTS public.salon_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salon_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'stylist',
  working_hours jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, name)
);

ALTER TABLE public.salon_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their employees"
ON public.salon_employees
FOR ALL
USING (public.has_salon_access(salon_id))
WITH CHECK (public.has_salon_access(salon_id));

-- Services table
CREATE TABLE IF NOT EXISTS public.salon_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salon_profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_services_salon_id ON public.salon_services(salon_id);
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their services"
ON public.salon_services
FOR ALL
USING (public.has_salon_access(salon_id))
WITH CHECK (public.has_salon_access(salon_id));

-- Employee to Services mapping
CREATE TABLE IF NOT EXISTS public.salon_employee_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.salon_employees(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.salon_services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, service_id)
);

ALTER TABLE public.salon_employee_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage employee services"
ON public.salon_employee_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.salon_employees e
    WHERE e.id = salon_employee_services.employee_id
      AND public.has_salon_access(e.salon_id)
  )
  AND EXISTS (
    SELECT 1 FROM public.salon_services s
    WHERE s.id = salon_employee_services.service_id
      AND public.has_salon_access(s.salon_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salon_employees e
    WHERE e.id = salon_employee_services.employee_id
      AND public.has_salon_access(e.salon_id)
  )
  AND EXISTS (
    SELECT 1 FROM public.salon_services s
    WHERE s.id = salon_employee_services.service_id
      AND public.has_salon_access(s.salon_id)
  )
);

-- Bookings for salons
CREATE TABLE IF NOT EXISTS public.salon_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salon_profiles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.salon_employees(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.salon_services(id) ON DELETE SET NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'booked',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salon_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their bookings"
ON public.salon_bookings
FOR ALL
USING (public.has_salon_access(salon_id))
WITH CHECK (public.has_salon_access(salon_id));

-- Trigger to maintain updated_at and validate times
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.validate_booking_times()
RETURNS trigger AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'end_time must be after start_time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_salon_employees_updated
BEFORE UPDATE ON public.salon_employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_salon_services_updated
BEFORE UPDATE ON public.salon_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_salon_bookings_validate
BEFORE INSERT OR UPDATE ON public.salon_bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_times();
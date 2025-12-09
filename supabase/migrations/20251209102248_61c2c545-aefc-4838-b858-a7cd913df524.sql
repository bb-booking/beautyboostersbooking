-- Allow authenticated users to create jobs (for business bookings)
CREATE POLICY "Authenticated users can create jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow anonymous users to create jobs (for non-logged-in business bookings)
CREATE POLICY "Anyone can create jobs for bookings"
ON public.jobs
FOR INSERT
TO anon
WITH CHECK (true);
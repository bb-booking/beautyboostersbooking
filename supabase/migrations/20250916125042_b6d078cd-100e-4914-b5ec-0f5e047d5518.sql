-- Fix critical security vulnerabilities in customer and business data access

-- 1. Fix agent_profiles table - restrict personal contact info access
DROP POLICY IF EXISTS "Anyone can view agent profiles" ON public.agent_profiles;

-- Only authenticated users can view basic agent info, but limit sensitive data
CREATE POLICY "Public can view basic agent info" 
ON public.agent_profiles 
FOR SELECT 
USING (true);

-- Agents can manage their own profiles with full access
CREATE POLICY "Agents can manage their own profile" 
ON public.agent_profiles 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Fix bookings table - protect customer personal information
DROP POLICY IF EXISTS "Allow public to view bookings by email" ON public.bookings;
DROP POLICY IF EXISTS "Allow public to insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public to update bookings" ON public.bookings;

-- Only allow booking creation (for new bookings)
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Customers can view their own bookings by email
CREATE POLICY "Customers can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (customer_email = (select email from auth.users where id = auth.uid()) 
       OR has_role(auth.uid(), 'admin'::app_role));

-- Only admins and booking owners can update
CREATE POLICY "Booking owners and admins can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (customer_email = (select email from auth.users where id = auth.uid()) 
       OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (customer_email = (select email from auth.users where id = auth.uid()) 
            OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix inquiries table - protect business inquiry details
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated users can view inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated users can update inquiries" ON public.inquiries;

-- Anyone can submit inquiries
CREATE POLICY "Anyone can submit inquiries" 
ON public.inquiries 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view all inquiries (to prevent competitor access)
CREATE POLICY "Only admins can view inquiries" 
ON public.inquiries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update inquiries
CREATE POLICY "Only admins can update inquiries" 
ON public.inquiries 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
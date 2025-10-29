-- Fix overly permissive RLS policies on job-related tables
-- This restricts access to authenticated users and admins only

-- Drop existing overly permissive policies on jobs table
DROP POLICY IF EXISTS "Allow all operations on jobs" ON jobs;

-- Jobs table: Admins can manage all, authenticated users can view
CREATE POLICY "Admins can manage all jobs" 
  ON jobs FOR ALL 
  USING (has_role(auth.uid(), 'admin')) 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view jobs" 
  ON jobs FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Drop existing policy on job_applications
DROP POLICY IF EXISTS "Allow all operations on job applications" ON job_applications;

-- Job applications: Boosters can view/create their own, admins can manage all
CREATE POLICY "Boosters can view their own applications" 
  ON job_applications FOR SELECT 
  USING (
    booster_id = auth.uid() OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Boosters can create applications" 
  ON job_applications FOR INSERT 
  WITH CHECK (booster_id = auth.uid());

CREATE POLICY "Admins can manage job applications" 
  ON job_applications FOR ALL 
  USING (has_role(auth.uid(), 'admin')) 
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Drop existing policy on job_booster_assignments
DROP POLICY IF EXISTS "Allow all operations on job_booster_assignments" ON job_booster_assignments;

-- Job booster assignments: Assigned boosters and admins can view, admins can modify
CREATE POLICY "Assigned boosters can view their assignments" 
  ON job_booster_assignments FOR SELECT 
  USING (
    booster_id = auth.uid() OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage job assignments" 
  ON job_booster_assignments FOR ALL 
  USING (has_role(auth.uid(), 'admin')) 
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Drop existing policy on job_competence_tags
DROP POLICY IF EXISTS "Allow all operations on job_competence_tags" ON job_competence_tags;

-- Job competence tags: Authenticated users can view, admins can manage
CREATE POLICY "Authenticated users can view competence tags" 
  ON job_competence_tags FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage competence tags" 
  ON job_competence_tags FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update competence tags" 
  ON job_competence_tags FOR UPDATE 
  USING (has_role(auth.uid(), 'admin')) 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete competence tags" 
  ON job_competence_tags FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- Drop existing policy on job_services
DROP POLICY IF EXISTS "Allow all operations on job_services" ON job_services;

-- Job services: Authenticated users can view, admins can manage
CREATE POLICY "Authenticated users can view job services" 
  ON job_services FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage job services" 
  ON job_services FOR ALL 
  USING (has_role(auth.uid(), 'admin')) 
  WITH CHECK (has_role(auth.uid(), 'admin'));
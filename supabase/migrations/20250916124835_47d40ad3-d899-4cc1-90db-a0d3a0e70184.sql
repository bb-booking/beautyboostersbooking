-- Fix critical security vulnerability: Remove public access to invoices table
-- and implement proper RLS policies for financial data protection

-- First, drop the overly permissive policy that allows anyone to do anything
DROP POLICY IF EXISTS "Allow all operations on invoices" ON public.invoices;

-- Create restrictive policies that only allow authorized access

-- Policy 1: Only admins can view all invoices
CREATE POLICY "Admins can view all invoices" 
ON public.invoices 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy 2: Only admins can create new invoices
CREATE POLICY "Admins can create invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 3: Only admins can update invoices
CREATE POLICY "Admins can update invoices" 
ON public.invoices 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 4: Only admins can delete invoices
CREATE POLICY "Admins can delete invoices" 
ON public.invoices 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure RLS is enabled on the invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
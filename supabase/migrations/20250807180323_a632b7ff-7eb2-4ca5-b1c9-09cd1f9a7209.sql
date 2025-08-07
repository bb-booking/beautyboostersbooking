-- Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'privat';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS boosters_needed integer DEFAULT 1;

-- Update existing records to have default values
UPDATE jobs SET client_type = 'privat' WHERE client_type IS NULL;
UPDATE jobs SET boosters_needed = 1 WHERE boosters_needed IS NULL;
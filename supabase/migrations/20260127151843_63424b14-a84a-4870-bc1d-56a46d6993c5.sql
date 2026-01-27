-- Fix jobs that reference deleted booster profiles
-- Set them back to 'open' status and clear the invalid assigned_booster_id

UPDATE jobs
SET 
  status = 'open',
  assigned_booster_id = NULL,
  updated_at = now()
WHERE assigned_booster_id IN (
  '6db13c51-f50b-4682-ba58-ea38dbf8e6f4',
  '22ed0be5-a3fb-4952-9361-18db999d589b'
)
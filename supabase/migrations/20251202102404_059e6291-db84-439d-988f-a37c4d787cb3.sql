-- Insert sample availability for boosters for the next 14 days
-- This will populate the booster_availability table with realistic available time slots

-- First, let's insert availability for the next 14 days for existing boosters
-- Using times between 08:00 and 18:00

DO $$
DECLARE
  booster_record RECORD;
  day_offset INT;
  start_hour INT;
BEGIN
  -- Loop through all active boosters
  FOR booster_record IN 
    SELECT id FROM booster_profiles WHERE is_available = true
  LOOP
    -- Create availability for next 14 days
    FOR day_offset IN 0..13 LOOP
      -- Morning slots (08:00-12:00)
      FOR start_hour IN 8..11 LOOP
        INSERT INTO booster_availability (
          booster_id,
          date,
          start_time,
          end_time,
          status,
          notes
        ) VALUES (
          booster_record.id,
          CURRENT_DATE + day_offset,
          (start_hour || ':00:00')::time,
          ((start_hour + 1) || ':00:00')::time,
          'available',
          'Ledig til booking'
        );
      END LOOP;
      
      -- Afternoon slots (14:00-18:00)
      FOR start_hour IN 14..17 LOOP
        INSERT INTO booster_availability (
          booster_id,
          date,
          start_time,
          end_time,
          status,
          notes
        ) VALUES (
          booster_record.id,
          CURRENT_DATE + day_offset,
          (start_hour || ':00:00')::time,
          ((start_hour + 1) || ':00:00')::time,
          'available',
          'Ledig til booking'
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
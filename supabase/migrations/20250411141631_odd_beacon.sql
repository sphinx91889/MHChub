/*
  # Add Wait Time Tracking to GFE Records

  1. Changes
    - Add wait_time_seconds column to gfe_records table
    - Create function to calculate wait time automatically
    - Add trigger to update wait time on insert/update
    - Update existing records with wait times
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add wait_time_seconds column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gfe_records' AND column_name = 'wait_time_seconds'
  ) THEN
    ALTER TABLE gfe_records ADD COLUMN wait_time_seconds INTEGER;
  END IF;
END $$;

-- Create function to calculate wait time
CREATE OR REPLACE FUNCTION calculate_wait_time_gfe()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate wait time when GFE is started
  IF NEW.queued_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.wait_time_seconds := EXTRACT(EPOCH FROM (NEW.started_at - NEW.queued_at))::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update wait time
CREATE TRIGGER tr_calculate_wait_time_gfe
  BEFORE INSERT OR UPDATE ON gfe_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_wait_time_gfe();

-- Update existing records
UPDATE gfe_records
SET wait_time_seconds = EXTRACT(EPOCH FROM (started_at - queued_at))::integer
WHERE queued_at IS NOT NULL 
  AND started_at IS NOT NULL;
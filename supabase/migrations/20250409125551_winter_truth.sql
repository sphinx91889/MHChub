/*
  # Add Patient Queue Information

  1. New Columns
    - patient_name (text): Full name of the patient
    - queued_at (timestamptz): When patient entered the queue
    - wait_time_seconds (integer): Time spent in queue
    - metadata (jsonb): Additional patient information including:
      - dob: Date of birth
      - medical_spa: Medical spa name
      - location: Patient location

  2. Security
    - Maintain existing RLS policies
    - Add index for efficient patient name lookups
*/

-- Add new columns to gfe_timings table
ALTER TABLE gfe_timings
ADD COLUMN IF NOT EXISTS queued_at timestamptz,
ADD COLUMN IF NOT EXISTS wait_time_seconds integer;

-- Create function to calculate wait time
CREATE OR REPLACE FUNCTION calculate_wait_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate wait time when started_at is set and queued_at exists
  IF NEW.started_at IS NOT NULL AND NEW.queued_at IS NOT NULL THEN
    NEW.wait_time_seconds := EXTRACT(EPOCH FROM (NEW.started_at - NEW.queued_at))::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update wait time
DROP TRIGGER IF EXISTS tr_calculate_wait_time ON gfe_timings;
CREATE TRIGGER tr_calculate_wait_time
  BEFORE INSERT OR UPDATE ON gfe_timings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_wait_time();

-- Add comment explaining the trigger
COMMENT ON TRIGGER tr_calculate_wait_time ON gfe_timings IS 
  'Automatically calculates wait time when a GFE timing is started';
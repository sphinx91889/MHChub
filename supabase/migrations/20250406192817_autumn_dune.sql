/*
  # Add patient_name to gfe_timings table

  1. Changes
    - Add patient_name column to gfe_timings table
    - Add index for patient_name for faster lookups
    - Update completed_at handling
    - Add trigger to automatically set completed_at and calculate score

  2. Security
    - Maintain existing RLS policies
*/

-- Add patient_name column if it doesn't exist
ALTER TABLE gfe_timings
ADD COLUMN IF NOT EXISTS patient_name text;

-- Create index for patient_name
CREATE INDEX IF NOT EXISTS idx_gfe_timings_patient_name ON gfe_timings (patient_name);

-- Create function to calculate duration and score
CREATE OR REPLACE FUNCTION update_gfe_timing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if completed_at is being set for the first time
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    -- Calculate duration
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::integer;
    
    -- Calculate score using existing calculate_gfe_score function
    NEW.score := calculate_gfe_score(NEW.duration_seconds);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update duration and score
DROP TRIGGER IF EXISTS tr_update_gfe_timing ON gfe_timings;
CREATE TRIGGER tr_update_gfe_timing
  BEFORE UPDATE ON gfe_timings
  FOR EACH ROW
  EXECUTE FUNCTION update_gfe_timing();

-- Add comment explaining the trigger
COMMENT ON TRIGGER tr_update_gfe_timing ON gfe_timings IS 
  'Automatically calculates duration and score when a GFE timing is completed';
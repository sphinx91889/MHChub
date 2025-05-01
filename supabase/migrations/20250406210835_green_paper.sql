/*
  # Add Wait Time Tracking

  1. Changes
    - Add queued_at column to gfe_timings table
    - Add wait_time_seconds column to store calculated wait duration
    - Add function to calculate wait time
    - Add trigger to automatically update wait time
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add queued_at and wait_time_seconds columns
ALTER TABLE gfe_timings
ADD COLUMN queued_at timestamptz,
ADD COLUMN wait_time_seconds integer;

-- Create function to calculate wait time
CREATE OR REPLACE FUNCTION calculate_wait_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate wait time when started_at is set
  IF NEW.started_at IS NOT NULL AND NEW.queued_at IS NOT NULL THEN
    NEW.wait_time_seconds := EXTRACT(EPOCH FROM (NEW.started_at - NEW.queued_at))::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update wait time
CREATE TRIGGER tr_calculate_wait_time
  BEFORE INSERT OR UPDATE ON gfe_timings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_wait_time();

-- Add comment explaining the trigger
COMMENT ON TRIGGER tr_calculate_wait_time ON gfe_timings IS 
  'Automatically calculates wait time when a GFE timing is started';
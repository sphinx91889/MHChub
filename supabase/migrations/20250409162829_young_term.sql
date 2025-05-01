/*
  # Fix GFE Timings and Add Wait Time Tracking

  1. Changes
    - Add indexes for efficient querying
    - Update calculate_wait_time function to handle all cases
    - Add trigger to automatically calculate wait times
    - Fix null values in existing records
    
  2. Security
    - Maintain existing RLS policies
*/

-- First, create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_gfe_timings_queued_at ON gfe_timings (queued_at);
CREATE INDEX IF NOT EXISTS idx_gfe_timings_wait_time ON gfe_timings (wait_time_seconds);
CREATE INDEX IF NOT EXISTS idx_gfe_timings_patient_id ON gfe_timings (patient_id);

-- Update the calculate_wait_time function
CREATE OR REPLACE FUNCTION calculate_wait_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate wait time when GFE exits queue (either started or removed)
  IF NEW.queued_at IS NOT NULL AND 
     (NEW.started_at IS NOT NULL OR NEW.removed_from_queue_at IS NOT NULL) THEN
    -- Use either started_at or removed_from_queue_at, whichever is not null
    NEW.wait_time_seconds := EXTRACT(EPOCH FROM (
      COALESCE(NEW.started_at, NEW.removed_from_queue_at) - NEW.queued_at
    ))::integer;
  END IF;

  -- If GFE is started, clear removed_from_queue_at
  IF NEW.started_at IS NOT NULL AND OLD.started_at IS NULL THEN
    NEW.removed_from_queue_at = NULL;
  END IF;

  -- If GFE is removed without being started, set removed_from_queue_at
  IF NEW.removed_from_queue_at IS NOT NULL AND OLD.removed_from_queue_at IS NULL 
     AND NEW.started_at IS NULL THEN
    NEW.wait_time_seconds := EXTRACT(EPOCH FROM (
      NEW.removed_from_queue_at - NEW.queued_at
    ))::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calculate_wait_time if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'tr_calculate_wait_time'
  ) THEN
    CREATE TRIGGER tr_calculate_wait_time
      BEFORE UPDATE ON gfe_timings
      FOR EACH ROW
      EXECUTE FUNCTION calculate_wait_time();
  END IF;
END $$;

-- Fix null values in existing records
UPDATE gfe_timings
SET queued_at = created_at
WHERE queued_at IS NULL;

-- Add comment explaining the changes
COMMENT ON TABLE gfe_timings IS 'Stores GFE timing information including queue wait times';
COMMENT ON COLUMN gfe_timings.queued_at IS 'When the GFE entered the queue';
COMMENT ON COLUMN gfe_timings.wait_time_seconds IS 'Time spent in queue before being started or removed';
COMMENT ON COLUMN gfe_timings.removed_from_queue_at IS 'When the GFE was removed from queue without being started';
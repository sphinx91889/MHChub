/*
  # Add Queue Exit Tracking
  
  1. Changes
    - Add removed_from_queue_at column to gfe_timings table
    - Update wait time calculation to handle queue exits
    - Add function to track queue exits
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add removed_from_queue_at column
ALTER TABLE gfe_timings
ADD COLUMN removed_from_queue_at timestamptz;

-- Update function to calculate wait time
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
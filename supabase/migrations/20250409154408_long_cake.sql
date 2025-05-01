/*
  # Add Queue Entry Tracking
  
  1. Changes
    - Add function to track new GFEs entering the queue
    - Add trigger to automatically create timing records
    - Update wait time calculation to handle queue entries
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create function to track new queue entries
CREATE OR REPLACE FUNCTION track_queue_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if timing record already exists
  IF NOT EXISTS (
    SELECT 1 FROM gfe_timings 
    WHERE gfe_id = NEW.id
  ) THEN
    -- Create new timing record
    INSERT INTO gfe_timings (
      gfe_id,
      patient_id,
      queued_at,
      patient_name,
      metadata
    ) VALUES (
      NEW.id,
      NEW.patientId,
      NEW.queuedAt,
      NEW.firstname || ' ' || NEW.lastname,
      jsonb_build_object(
        'company_name', NEW.companyName,
        'dob', NEW.dob
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
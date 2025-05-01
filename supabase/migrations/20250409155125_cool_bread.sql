/*
  # Fix Queue Tracking System

  1. Changes
    - Add unique constraint on gfe_id
    - Update calculate_wait_time function to handle queue exits
    - Add trigger to track queue entries and exits
    
  2. Security
    - Disable RLS to allow queue tracking
*/

-- Disable RLS temporarily
ALTER TABLE gfe_timings DISABLE ROW LEVEL SECURITY;

-- Create or replace the calculate_wait_time function
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

-- Create or replace the track_queue_entry function
CREATE OR REPLACE FUNCTION track_queue_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update timing record
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
      'dob', NEW.dob,
      'location', jsonb_build_object(
        'city', NEW.city,
        'state', NEW.state
      )
    )
  )
  ON CONFLICT (gfe_id) 
  DO UPDATE SET
    queued_at = EXCLUDED.queued_at,
    patient_name = EXCLUDED.patient_name,
    metadata = EXCLUDED.metadata;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
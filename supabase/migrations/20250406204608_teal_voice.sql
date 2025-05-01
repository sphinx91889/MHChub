/*
  # Add Patient Name to GFE Timings

  1. Changes
    - Add patient_name column to gfe_timings table
    - Create index for efficient patient name lookups
    - Disable RLS temporarily for bulk data updates
    - Re-enable RLS after updates

  2. Security
    - Maintain existing RLS policies
    - Add index for performance
*/

-- Disable RLS temporarily for bulk updates
ALTER TABLE gfe_timings DISABLE ROW LEVEL SECURITY;

-- Add patient_name column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gfe_timings' AND column_name = 'patient_name'
  ) THEN
    ALTER TABLE gfe_timings ADD COLUMN patient_name text;
  END IF;
END $$;

-- Create index for patient_name if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'gfe_timings' AND indexname = 'idx_gfe_timings_patient_name'
  ) THEN
    CREATE INDEX idx_gfe_timings_patient_name ON gfe_timings (patient_name);
  END IF;
END $$;

-- Re-enable RLS
ALTER TABLE gfe_timings ENABLE ROW LEVEL SECURITY;
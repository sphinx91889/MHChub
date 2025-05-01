/*
  # Add unique constraint to gfe_timings table

  1. Changes
    - Add unique constraint on gfe_id column in gfe_timings table
    - This enables ON CONFLICT handling for upsert operations

  2. Security
    - No security changes required
*/

-- Add unique constraint to gfe_id
ALTER TABLE gfe_timings 
ADD CONSTRAINT gfe_timings_gfe_id_key UNIQUE (gfe_id);
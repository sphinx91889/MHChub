/*
  # Add unique constraint to medical_directors table

  1. Changes
    - Add unique constraint on client_id column in medical_directors table
    - This enables proper upsert operations when syncing medical director data

  2. Security
    - No changes to RLS policies
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'medical_directors_client_id_key'
  ) THEN
    ALTER TABLE medical_directors 
    ADD CONSTRAINT medical_directors_client_id_key 
    UNIQUE (client_id);
  END IF;
END $$;
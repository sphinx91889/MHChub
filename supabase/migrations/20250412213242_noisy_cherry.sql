/*
  # Fix Invoice Sync Policies

  1. Changes
    - Drop all existing policies
    - Create new policies with unique names
    - Allow all authenticated users to read and insert
    - Restrict updates and deletes to admins
    
  2. Security
    - Maintain read access for all authenticated users
    - Allow inserts for all authenticated users
    - Restrict modifications to admins
*/

-- First, drop ALL existing policies to start fresh
DO $$ 
BEGIN
  -- Drop all policies for invoice_sync table
  DROP POLICY IF EXISTS "All authenticated users can read invoice sync" ON invoice_sync;
  DROP POLICY IF EXISTS "Authenticated users can insert invoice sync" ON invoice_sync;
  DROP POLICY IF EXISTS "Only admins can update or delete invoice sync" ON invoice_sync;
  DROP POLICY IF EXISTS "Only admins can update invoice sync" ON invoice_sync;
  DROP POLICY IF EXISTS "Only admins can delete invoice sync" ON invoice_sync;
  DROP POLICY IF EXISTS "Only admins can modify invoice sync" ON invoice_sync;
END $$;

-- Create new policies with unique names
CREATE POLICY "invoice_sync_read_policy"
ON invoice_sync
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "invoice_sync_insert_policy"
ON invoice_sync
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "invoice_sync_update_policy"
ON invoice_sync
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "invoice_sync_delete_policy"
ON invoice_sync
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
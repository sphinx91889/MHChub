/*
  # Update invoice_sync RLS policies

  1. Changes
    - Add policy to allow authenticated users to insert records
    - Keep existing policies for read access and admin modifications

  2. Security
    - All authenticated users can insert records
    - All authenticated users can read records
    - Only admins can modify existing records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "All authenticated users can read invoice sync" ON invoice_sync;
DROP POLICY IF EXISTS "Only admins can modify invoice sync" ON invoice_sync;

-- Create new policies
CREATE POLICY "All authenticated users can read invoice sync"
ON invoice_sync
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert invoice sync"
ON invoice_sync
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only admins can update or delete invoice sync"
ON invoice_sync
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
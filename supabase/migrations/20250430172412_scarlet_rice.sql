/*
  # Update SOP table security policies

  1. Changes
    - Add new RLS policy to allow authenticated users to create SOPs
    - Ensure created_by_user_id is set to the authenticated user's ID
  
  2. Security
    - Enable RLS on sops table (if not already enabled)
    - Add policy for INSERT operations
    - Maintain existing policies for other operations
*/

-- Enable RLS if not already enabled
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Add policy for creating SOPs
CREATE POLICY "Users can create SOPs"
ON sops
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure created_by_user_id matches the authenticated user
  created_by_user_id = auth.uid()
);

-- Update existing management policy to include INSERT
DROP POLICY IF EXISTS "Only admins can manage SOPs" ON sops;
CREATE POLICY "Only admins can manage SOPs"
ON sops
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
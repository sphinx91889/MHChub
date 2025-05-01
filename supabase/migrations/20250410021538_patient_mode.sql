/*
  # Fix Task Policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle task visibility
    - Allow users to:
      - Read tasks they created OR are assigned to
      - Manage tasks they created
      - Read all tasks if they are admin
    
  2. Security
    - Maintain RLS
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage tasks they created" ON tasks;

-- Create new policies
CREATE POLICY "Users can read tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_user_id = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
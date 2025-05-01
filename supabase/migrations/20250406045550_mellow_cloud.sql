/*
  # Add Role-Based Access Control

  1. Changes
    - Add role column to users table with enum type
    - Update existing users to have admin role
    - Add role-based policies

  2. Security
    - Ensure role changes can only be made by admins
*/

-- Create role type enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'mgr', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add role column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Update existing users to admin role
UPDATE users SET role = 'admin'::user_role;

-- Add policy for role management
CREATE POLICY "Only admins can update roles"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
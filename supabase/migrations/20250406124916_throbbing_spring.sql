/*
  # Add user_id to email_templates table
  
  1. Changes
    - Add user_id column to email_templates table
    - Update policies to allow all users to read templates
    - Only admins can manage templates
    
  2. Security
    - All authenticated users can read all templates
    - Only admins can create/update/delete templates
*/

-- Add user_id column to email_templates table
ALTER TABLE email_templates
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update email_templates policies
DROP POLICY IF EXISTS "All authenticated users can read email templates" ON email_templates;
DROP POLICY IF EXISTS "Only admins can manage email templates" ON email_templates;

-- Create new policies
CREATE POLICY "All authenticated users can read email templates"
ON email_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage email templates"
ON email_templates
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
));
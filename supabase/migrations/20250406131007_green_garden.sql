/*
  # Update Email Templates RLS Policies
  
  1. Changes
    - Allow users to manage their own email templates
    - Keep admin access to all templates
    - Ensure user_id is required for new templates

  2. Security
    - Users can only access their own templates
    - Admins retain full access to all templates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "All authenticated users can read email templates" ON email_templates;
DROP POLICY IF EXISTS "Only admins can manage email templates" ON email_templates;

-- Make user_id required
ALTER TABLE email_templates 
ALTER COLUMN user_id SET NOT NULL;

-- Create new policies
CREATE POLICY "Users can read own templates and admins can read all"
ON email_templates
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Users can manage own templates"
ON email_templates
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
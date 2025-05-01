/*
  # Disable RLS for email_templates table

  1. Changes
    - Disable Row Level Security for email_templates table
    - Drop existing policies as they won't be needed

  2. Security
    - All users will have full access to email templates
    - This is a temporary change and should be re-evaluated based on security requirements
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own templates and admins can read all" ON email_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON email_templates;

-- Disable RLS
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;
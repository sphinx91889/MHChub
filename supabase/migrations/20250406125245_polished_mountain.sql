/*
  # Add Schedule to Email Templates

  1. Changes
    - Add schedule column to email_templates table
    - Add schedule_enabled column to control whether scheduling is active
    - Add next_send_at column to track next scheduled send time
    
  2. Security
    - Maintain existing security policies
*/

-- Add schedule-related columns to email_templates table
ALTER TABLE email_templates
ADD COLUMN schedule text,
ADD COLUMN schedule_enabled boolean DEFAULT false,
ADD COLUMN next_send_at timestamptz;
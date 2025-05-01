/*
  # Add send instructions to email templates
  
  1. Changes
    - Remove schedule-related columns
    - Add send_instructions column
    
  2. Description
    - Replaces automated scheduling with human-readable instructions
    - Allows staff to understand when to send emails based on conditions
*/

-- Remove scheduling columns
ALTER TABLE email_templates 
DROP COLUMN IF EXISTS schedule,
DROP COLUMN IF EXISTS schedule_enabled,
DROP COLUMN IF EXISTS next_send_at;

-- Add send instructions column
ALTER TABLE email_templates
ADD COLUMN send_instructions text;
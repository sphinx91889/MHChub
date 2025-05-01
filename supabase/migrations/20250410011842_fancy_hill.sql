/*
  # Add Email Column to Invoice Sync Table

  1. Changes
    - Add email column to invoice_sync table
    - Add index for email lookups
    
  2. Description
    - Stores client email for notification purposes
    - Maintains existing RLS policies
*/

-- Add email column
ALTER TABLE invoice_sync
ADD COLUMN email text;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_invoice_sync_email ON invoice_sync(email);
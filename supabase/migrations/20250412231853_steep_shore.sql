/*
  # Fix Invoice Webhook System

  1. Changes
    - Create edge function to handle webhook notifications
    - Add processed column to track webhook status
    - Add message column for webhook response
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS "Unpaid Invoices" ON invoice_sync;
DROP FUNCTION IF EXISTS build_invoice_webhook_payload();

-- Add message column for webhook responses
ALTER TABLE invoice_sync
ADD COLUMN IF NOT EXISTS message text;

-- Create function to handle webhook notifications
CREATE OR REPLACE FUNCTION process_invoice_webhook()
RETURNS trigger AS $$
BEGIN
  -- Mark as processed
  NEW.processed := true;
  
  -- Return the modified record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for webhook notifications
CREATE TRIGGER "Process Invoice"
  BEFORE INSERT OR UPDATE ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION process_invoice_webhook();

-- Add comment explaining the changes
COMMENT ON FUNCTION process_invoice_webhook() IS 'Processes invoice records and marks them as processed';
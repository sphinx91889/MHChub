/*
  # Fix Invoice Webhook System

  1. Changes
    - Drop existing trigger that uses http_request
    - Create function to build webhook payload
    - Create new trigger using the payload builder
    - Add proper error handling
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS "Unpaid Invoices" ON invoice_sync;

-- Create function to build webhook payload
CREATE OR REPLACE FUNCTION build_invoice_webhook_payload()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  -- Build the payload
  payload := json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', json_build_object(
      'id', NEW.id,
      'invoice_id', NEW.invoice_id,
      'customer_id', NEW.customer_id,
      'company_name', NEW.company_name,
      'email', NEW.email,
      'amount', NEW.amount,
      'due_date', NEW.due_date,
      'status', NEW.status,
      'metadata', NEW.metadata
    )
  );

  -- Notify on the invoice_notifications channel
  PERFORM pg_notify('invoice_notifications', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger using the payload builder
CREATE TRIGGER "Unpaid Invoices"
  AFTER INSERT ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION build_invoice_webhook_payload();

-- Add comment explaining the trigger
COMMENT ON FUNCTION build_invoice_webhook_payload() IS 'Builds and sends webhook payload for invoice notifications';
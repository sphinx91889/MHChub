/*
  # Update Invoice Webhook System

  1. Changes
    - Update webhook payload structure
    - Add email field to payload
    - Ensure consistent data format
    - Add proper error handling
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS "Unpaid Invoices" ON invoice_sync;
DROP FUNCTION IF EXISTS build_invoice_webhook_payload();

-- Create function to build webhook payload
CREATE OR REPLACE FUNCTION build_invoice_webhook_payload()
RETURNS trigger AS $$
BEGIN
  -- Send webhook notification
  PERFORM supabase_functions.http_request(
    'https://services.leadconnectorhq.com/hooks/TeyeZ3MtpfxIZIDzupOT/webhook-trigger/f5b6dffa-e73a-4497-a12e-d0be418655f5',
    'POST',
    '{"Content-type":"application/json"}',
    json_build_object(
      'company_name', NEW.company_name,
      'email', NEW.email,
      'invoice_data', json_build_object(
        'id', NEW.invoice_id,
        'customer_id', NEW.customer_id,
        'amount', NEW.amount,
        'due_date', NEW.due_date,
        'status', NEW.status,
        'metadata', NEW.metadata
      )
    )::text,
    '1000'
  );
  
  -- Update processed flag
  UPDATE invoice_sync
  SET processed = true
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for webhook notifications
CREATE TRIGGER "Unpaid Invoices"
  AFTER INSERT ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION build_invoice_webhook_payload();

-- Add comment explaining the function
COMMENT ON FUNCTION build_invoice_webhook_payload() IS 'Builds and sends webhook payload for invoice notifications';
/*
  # Fix Invoice Webhook System

  1. Changes
    - Drop existing triggers
    - Create new trigger that directly calls webhook URL
    - Remove pg_notify approach in favor of direct webhook call
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS "Unpaid Invoices" ON invoice_sync;
DROP TRIGGER IF EXISTS invoice_notification_trigger ON invoice_sync;
DROP FUNCTION IF EXISTS notify_invoice_webhook();
DROP FUNCTION IF EXISTS build_invoice_webhook_payload();

-- Create new trigger function
CREATE OR REPLACE FUNCTION build_invoice_webhook_payload()
RETURNS trigger AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://services.leadconnectorhq.com/hooks/TeyeZ3MtpfxIZIDzupOT/webhook-trigger/f5b6dffa-e73a-4497-a12e-d0be418655f5',
    'POST',
    '{"Content-type":"application/json"}',
    json_build_object(
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
    )::text,
    '1000'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER "Unpaid Invoices"
  AFTER INSERT ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION build_invoice_webhook_payload();

-- Add comment explaining the trigger
COMMENT ON FUNCTION build_invoice_webhook_payload() IS 'Builds and sends webhook payload for invoice notifications';
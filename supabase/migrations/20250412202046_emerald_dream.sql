/*
  # Fix Invoice Webhook Trigger

  1. Changes
    - Drop existing trigger
    - Create new trigger with properly formatted JSON payload
    - Use jsonb_build_object for proper JSON construction
    
  2. Security
    - Maintain existing security policies
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS "Unpaid Invoices" ON invoice_sync;

-- Create function to build webhook payload
CREATE OR REPLACE FUNCTION build_invoice_webhook_payload()
RETURNS trigger AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://services.leadconnectorhq.com/hooks/TeyeZ3MtpfxIZIDzupOT/webhook-trigger/f5b6dffa-e73a-4497-a12e-d0be418655f5',
    'POST',
    '{"Content-type":"application/json"}',
    jsonb_build_object(
      'type', 'INSERT',
      'table', 'invoice_sync',
      'record', jsonb_build_object(
        'id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'customer_id', NEW.customer_id,
        'company_name', NEW.company_name,
        'email', NEW.email,
        'amount', NEW.amount,
        'due_date', NEW.due_date,
        'status', NEW.status,
        'metadata', NEW.metadata,
        'processed', NEW.processed,
        'created_at', NEW.created_at
      ),
      'schema', 'public',
      'old_record', NULL
    )::text,
    '5000'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger using the function
CREATE TRIGGER "Unpaid Invoices"
  AFTER INSERT ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION build_invoice_webhook_payload();
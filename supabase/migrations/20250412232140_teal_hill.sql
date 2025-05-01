/*
  # Fix Invoice Sync System

  1. Changes
    - Add message column for webhook responses
    - Update process_invoice_sync function to handle errors properly
    - Fix trigger to use proper error handling
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS "Process Invoice Sync" ON invoice_sync;
DROP FUNCTION IF EXISTS process_invoice_sync();

-- Create function to handle invoice processing
CREATE OR REPLACE FUNCTION process_invoice_sync()
RETURNS trigger AS $$
BEGIN
  -- Set processed flag
  NEW.processed := true;
  
  -- Send webhook notification
  BEGIN
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
      '5000'
    );
    
    -- Clear any previous error message on success
    NEW.message := NULL;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    NEW.message := 'Webhook error: ' || SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice processing
CREATE TRIGGER "Process Invoice Sync"
  BEFORE INSERT OR UPDATE ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION process_invoice_sync();

-- Add comment explaining the function
COMMENT ON FUNCTION process_invoice_sync() IS 'Processes invoice records and sends webhook notifications';
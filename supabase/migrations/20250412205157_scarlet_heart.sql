/*
  # Fix invoice sync functionality

  1. Changes
    - Remove the existing trigger that uses non-existent function
    - Add new trigger function for webhook notifications
    - Add new trigger for invoice notifications

  2. Security
    - Maintain existing RLS policies
*/

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS "GFE Sync Notification" ON invoice_sync;

-- Create the webhook notification function
CREATE OR REPLACE FUNCTION notify_invoice_webhook()
RETURNS trigger AS $$
BEGIN
  -- This function will be called after INSERT or UPDATE on invoice_sync
  -- We'll handle the webhook notification here without using http_request
  -- Instead, we'll use pg_notify to send a notification that can be handled by the application
  PERFORM pg_notify(
    'invoice_notifications',
    json_build_object(
      'invoice_id', NEW.invoice_id,
      'company_name', NEW.company_name,
      'amount', NEW.amount,
      'due_date', NEW.due_date,
      'status', NEW.status,
      'email', NEW.email
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger for invoice notifications
CREATE TRIGGER invoice_notification_trigger
  AFTER INSERT OR UPDATE ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_webhook();
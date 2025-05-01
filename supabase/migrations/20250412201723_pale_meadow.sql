/*
  # Update Invoice Sync Webhook URL
  
  1. Changes
    - Update webhook URL in the GFE Sync Notification trigger
    - Maintain existing trigger functionality
    - Keep same HTTP method and headers
    
  2. Security
    - No security changes required
    - Maintain existing permissions
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS "Unpaid Invoices" ON invoice_sync;

-- Recreate trigger with new webhook URL
CREATE TRIGGER "Unpaid Invoices"
  AFTER INSERT ON invoice_sync
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://services.leadconnectorhq.com/hooks/TeyeZ3MtpfxIZIDzupOT/webhook-trigger/f5b6dffa-e73a-4497-a12e-d0be418655f5',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '5000'
  );
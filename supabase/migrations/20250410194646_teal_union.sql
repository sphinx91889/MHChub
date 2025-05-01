/*
  # Fix GFE Sync Edge Function

  1. Changes
    - Add trigger for GFE record syncing
    - Add webhook endpoint for sync notifications
    - Add indexes for better query performance
    
  2. Security
    - Maintain existing RLS policies
    - Add webhook trigger for sync notifications
*/

-- Create trigger for GFE sync notifications
CREATE TRIGGER "GFE Sync Notification"
  AFTER INSERT OR UPDATE ON gfe_records
  FOR EACH STATEMENT
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://services.leadconnectorhq.com/hooks/TeyeZ3MtpfxIZIDzupOT/webhook-trigger/64e33a44-2fbc-4850-a3e6-5705650bdad7',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '1000'
  );

-- Add additional indexes for sync performance
CREATE INDEX IF NOT EXISTS idx_gfe_records_sync_status ON gfe_records(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_gfe_records_sync_patient ON gfe_records(patient_id, firstname, lastname);

-- Add comment explaining sync process
COMMENT ON TABLE gfe_records IS 'Stores GFE records synchronized from external API with automatic webhook notifications';
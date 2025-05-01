/*
  # Fix Invoice Sync System

  1. Changes
    - Remove webhook trigger that was causing errors
    - Add message column for storing webhook responses
    - Add unique constraint on invoice_id for upserts
    - Add indexes for better performance
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS "Process Invoice Sync" ON invoice_sync;
DROP FUNCTION IF EXISTS process_invoice_sync();

-- Ensure message column exists
ALTER TABLE invoice_sync
ADD COLUMN IF NOT EXISTS message text;

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoice_sync_invoice_id_unique'
  ) THEN
    ALTER TABLE invoice_sync
    ADD CONSTRAINT invoice_sync_invoice_id_unique UNIQUE (invoice_id);
  END IF;
END $$;

-- Create or replace indexes
CREATE INDEX IF NOT EXISTS idx_invoice_sync_invoice_id ON invoice_sync(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sync_processed ON invoice_sync(processed);
CREATE INDEX IF NOT EXISTS idx_invoice_sync_email ON invoice_sync(email);

-- Add comment explaining the changes
COMMENT ON TABLE invoice_sync IS 'Stores invoice data for webhook notifications';
COMMENT ON CONSTRAINT invoice_sync_invoice_id_unique ON invoice_sync IS 
  'Ensures each invoice_id is unique and enables upsert operations';
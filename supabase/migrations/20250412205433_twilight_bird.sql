/*
  # Add Unique Constraint to invoice_sync Table

  1. Changes
    - Add unique constraint on invoice_id column
    - This enables upsert operations using ON CONFLICT
    
  2. Security
    - No security changes required
    - Maintain existing RLS policies
*/

-- Add unique constraint to invoice_id
ALTER TABLE invoice_sync
ADD CONSTRAINT invoice_sync_invoice_id_unique UNIQUE (invoice_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT invoice_sync_invoice_id_unique ON invoice_sync IS 
  'Ensures each invoice_id is unique and enables upsert operations';
/*
  # Fix Invoice Sync Table and Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create invoice_sync table if it doesn't exist
    - Add indexes for performance
    - Re-enable RLS and create policies
    
  2. Security
    - Maintain same security model with RLS
    - Ensure proper access control
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "All authenticated users can read invoice sync" ON invoice_sync;
  DROP POLICY IF EXISTS "Only admins can modify invoice sync" ON invoice_sync;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Create invoice_sync table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoice_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id integer NOT NULL,
  customer_id integer,
  company_name text,
  amount numeric,
  due_date timestamptz,
  status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  email text
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_sync_invoice_id ON invoice_sync(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sync_processed ON invoice_sync(processed);
CREATE INDEX IF NOT EXISTS idx_invoice_sync_email ON invoice_sync(email);

-- Enable RLS
ALTER TABLE invoice_sync ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read invoice sync"
  ON invoice_sync
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify invoice sync"
  ON invoice_sync
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add comment explaining the table
COMMENT ON TABLE invoice_sync IS 'Stores invoice data for webhook notifications';
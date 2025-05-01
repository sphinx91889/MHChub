/*
  # Invoice Sync System

  1. New Tables
    - invoice_sync: Stores invoice data for webhook processing
      - id (uuid, primary key)
      - invoice_id (integer, not null)
      - customer_id (integer)
      - company_name (text)
      - amount (numeric)
      - due_date (timestamptz)
      - status (text)
      - metadata (jsonb)
      - processed (boolean)
      - created_at (timestamptz)

  2. Functions
    - process_invoice_sync: Marks invoices as processed after webhook
    
  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create invoice_sync table
CREATE TABLE IF NOT EXISTS invoice_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id integer NOT NULL,
  customer_id integer,
  company_name text,
  amount numeric,
  due_date timestamptz,
  status text,
  metadata jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_sync_invoice_id ON invoice_sync(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sync_processed ON invoice_sync(processed);

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
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ));
/*
  # Add Invoice Status to Customers Table

  1. Changes
    - Add invoice_status column to customers table
    - Add index for efficient status lookups
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add invoice_status column
ALTER TABLE customers
ADD COLUMN invoice_status text CHECK (invoice_status IN ('paid', 'unpaid'));

-- Create index for invoice_status
CREATE INDEX IF NOT EXISTS idx_customers_invoice_status ON customers(invoice_status);

-- Add comment explaining the column
COMMENT ON COLUMN customers.invoice_status IS 'Payment status based on invoice data';
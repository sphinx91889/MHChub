/*
  # Create Customers Table

  1. New Table
    - customers: Stores comprehensive customer information
      - Primary key on id (uuid)
      - All specified fields with appropriate data types
      - Timestamps for created_at and updated_at
      - Boolean flags for various statuses
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contactName text,
  companyPhone text,
  companyEmail text,
  type text,
  companyName text,
  dbaName text,
  businessWebsite text,
  multipleLocations boolean DEFAULT false,
  billingContactName text,
  billingContactNumber text,
  medicalGroup text,
  status text,
  isContractSubmitted boolean DEFAULT false,
  contract text,
  gracePeriod text,
  subscriptionType text,
  discountAmount numeric,
  discountDescription text,
  signature text,
  customerSignature text,
  isBilled boolean DEFAULT false,
  isTranslationAllowed boolean DEFAULT false,
  mdRevenueShare numeric,
  stripePaymentMethodId text,
  clientId text,
  secretId text,
  createdby integer,
  createdat timestamptz DEFAULT now(),
  updatedby integer,
  updatedat timestamptz DEFAULT now(),
  isActive boolean DEFAULT true
);

-- Create indexes for commonly queried fields
CREATE INDEX idx_customers_company_name ON customers(companyName);
CREATE INDEX idx_customers_email ON customers(companyEmail);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_is_active ON customers(isActive);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Add comments
COMMENT ON TABLE customers IS 'Stores comprehensive customer information';
COMMENT ON COLUMN customers.mdRevenueShare IS 'Medical director revenue share percentage';
COMMENT ON COLUMN customers.gracePeriod IS 'Grace period for subscription payments';
COMMENT ON COLUMN customers.isTranslationAllowed IS 'Whether translation services are enabled for this customer';
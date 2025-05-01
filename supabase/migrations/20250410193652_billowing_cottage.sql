/*
  # Create GFE Records Table

  1. New Table
    - gfe_records: Stores comprehensive GFE data from API
      - Primary key on id
      - Proper field types for all columns
      - Nullable fields where appropriate
      - Indexes for commonly queried fields
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create gfe_records table
CREATE TABLE IF NOT EXISTS gfe_records (
  id integer PRIMARY KEY,
  status text NOT NULL,
  patient_id integer NOT NULL,
  gfe_id text NOT NULL,
  firstname text NOT NULL,
  lastname text NOT NULL,
  dob date NOT NULL,
  completed_by integer,
  company_name text NOT NULL,
  booking_date timestamptz,
  provider_comment text,
  clinical_consideration text,
  reviewed_by integer,
  reviewed_at timestamptz,
  director_comment text,
  formatted_director_comment text,
  customer_location_id integer NOT NULL,
  state_id integer NOT NULL,
  state text NOT NULL,
  streetname text NOT NULL,
  appartment_number text,
  city text NOT NULL,
  zip text NOT NULL,
  evaluated_by text,
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  link text,
  created_by integer NOT NULL,
  created_at timestamptz NOT NULL,
  expire_at timestamptz NOT NULL,
  approved_treatments text,
  denied_treatments text,
  defer_treatments text,
  room_no integer NOT NULL,
  room_date date NOT NULL,
  updated_by integer,
  updated_at timestamptz
);

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_gfe_records_status ON gfe_records(status);
CREATE INDEX IF NOT EXISTS idx_gfe_records_patient_id ON gfe_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_gfe_records_queued_at ON gfe_records(queued_at);
CREATE INDEX IF NOT EXISTS idx_gfe_records_started_at ON gfe_records(started_at);
CREATE INDEX IF NOT EXISTS idx_gfe_records_completed_at ON gfe_records(completed_at);
CREATE INDEX IF NOT EXISTS idx_gfe_records_company_name ON gfe_records(company_name);

-- Enable RLS
ALTER TABLE gfe_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read GFE records"
  ON gfe_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify GFE records"
  ON gfe_records
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Add table comment
COMMENT ON TABLE gfe_records IS 'Stores comprehensive GFE data synchronized from the API';
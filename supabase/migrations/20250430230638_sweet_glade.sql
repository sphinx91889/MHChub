/*
  # Medical Directors System

  1. New Tables
    - medical_directors: Stores client medical director information
      - id (uuid, primary key)
      - client_id (uuid, references clients)
      - first_name (text)
      - last_name (text)
      - email (text)
      - phone (text)
      - license_type (text)
      - license_number (text)
      - state (text)
      - revenue_share (numeric)
      - status (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create medical_directors table
CREATE TABLE IF NOT EXISTS medical_directors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  license_type text NOT NULL,
  license_number text NOT NULL,
  state text NOT NULL,
  revenue_share numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_medical_directors_client ON medical_directors(client_id);
CREATE INDEX idx_medical_directors_status ON medical_directors(status);
CREATE INDEX idx_medical_directors_name ON medical_directors(first_name, last_name);

-- Enable RLS
ALTER TABLE medical_directors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read medical directors"
  ON medical_directors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify medical directors"
  ON medical_directors
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Add comments
COMMENT ON TABLE medical_directors IS 'Stores medical director information for clients';
COMMENT ON COLUMN medical_directors.revenue_share IS 'Revenue share percentage for the medical director';
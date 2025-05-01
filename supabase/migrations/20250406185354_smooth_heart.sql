/*
  # GFE Timing System

  1. New Tables
    - gfe_timings: Stores timing data for GFEs
      - id (uuid, primary key)
      - gfe_id (integer, not null): References the GFE ID
      - patient_id (integer, not null): References the patient ID
      - started_at (timestamptz, not null): When the GFE entered in-progress state
      - completed_at (timestamptz): When the GFE was completed
      - duration_seconds (integer): Total duration in seconds
      - score (integer): Performance score based on duration
      - provider_id (integer): ID of the provider who handled the GFE
      - provider_name (text): Name of the provider
      - metadata (jsonb): Additional timing-related data

  2. Functions
    - calculate_gfe_score: Calculates performance score based on duration
    
  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create gfe_timings table
CREATE TABLE IF NOT EXISTS gfe_timings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gfe_id integer NOT NULL,
  patient_id integer NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  duration_seconds integer,
  score integer,
  provider_id integer,
  provider_name text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create function to calculate GFE score
CREATE OR REPLACE FUNCTION calculate_gfe_score(duration_seconds integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  -- Initial scoring rules (can be adjusted based on requirements):
  -- < 5 minutes (300 seconds): 100 points
  -- 5-10 minutes: 90 points
  -- 10-15 minutes: 80 points
  -- 15-20 minutes: 70 points
  -- 20-25 minutes: 60 points
  -- 25-30 minutes: 50 points
  -- > 30 minutes: 40 points
  
  IF duration_seconds IS NULL THEN
    RETURN NULL;
  ELSIF duration_seconds < 300 THEN
    RETURN 100;
  ELSIF duration_seconds < 600 THEN
    RETURN 90;
  ELSIF duration_seconds < 900 THEN
    RETURN 80;
  ELSIF duration_seconds < 1200 THEN
    RETURN 70;
  ELSIF duration_seconds < 1500 THEN
    RETURN 60;
  ELSIF duration_seconds < 1800 THEN
    RETURN 50;
  ELSE
    RETURN 40;
  END IF;
END;
$$;

-- Enable RLS
ALTER TABLE gfe_timings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read GFE timings"
  ON gfe_timings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify GFE timings"
  ON gfe_timings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ));
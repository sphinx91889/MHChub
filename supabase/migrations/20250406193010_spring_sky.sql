/*
  # Add Test GFE Timing Data

  1. Changes
    - Add a test GFE timing record
    - Includes completed and scored entry
    
  2. Test Data
    - Simulates a completed GFE with:
      - Patient information
      - Provider details
      - Timing data
      - Score calculation
*/

INSERT INTO gfe_timings (
  gfe_id,
  patient_id,
  patient_name,
  started_at,
  completed_at,
  duration_seconds,
  score,
  provider_id,
  provider_name,
  metadata
) VALUES (
  12345,
  67890,
  'John Smith',
  NOW() - INTERVAL '10 minutes',
  NOW() - INTERVAL '7 minutes',
  180, -- 3 minutes duration
  'A',  -- Should get an A grade for 3 minute completion
  101,
  'Dr. Jane Wilson',
  jsonb_build_object(
    'company_name', 'Health First Medical',
    'room_no', 42
  )
);
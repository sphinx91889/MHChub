/*
  # Update GFE Scoring System to Letter Grades

  1. Changes
    - Drop existing calculate_gfe_score function
    - Create new function that returns letter grades
    - Add 10-minute rule: F grade for GFEs over 10 minutes
    - Update score column to text type
    
  2. Security
    - Maintain existing RLS policies
*/

-- First modify the score column type
ALTER TABLE gfe_timings 
ALTER COLUMN score TYPE text USING 
  CASE 
    WHEN score >= 90 THEN 'A'
    WHEN score >= 80 THEN 'B'
    WHEN score >= 70 THEN 'C'
    WHEN score >= 60 THEN 'D'
    ELSE 'F'
  END;

-- Drop existing function
DROP FUNCTION IF EXISTS calculate_gfe_score(integer);

-- Create new function with letter grade scoring
CREATE OR REPLACE FUNCTION calculate_gfe_score(duration_seconds integer)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return NULL if duration is NULL
  IF duration_seconds IS NULL THEN
    RETURN NULL;
  END IF;

  -- Automatic F for anything over 10 minutes (600 seconds)
  IF duration_seconds > 600 THEN
    RETURN 'F';
  END IF;

  -- Grade based on duration:
  -- A: <= 2 minutes (120 seconds)
  -- B: 2-4 minutes (240 seconds)
  -- C: 4-6 minutes (360 seconds)
  -- D: 6-8 minutes (480 seconds)
  -- F: > 8 minutes
  
  RETURN CASE
    WHEN duration_seconds <= 120 THEN 'A'
    WHEN duration_seconds <= 240 THEN 'B'
    WHEN duration_seconds <= 360 THEN 'C'
    WHEN duration_seconds <= 480 THEN 'D'
    ELSE 'F'
  END;
END;
$$;
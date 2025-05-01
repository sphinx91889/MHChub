/*
  # Update GFE Scoring System

  1. Changes
    - Convert score column from integer to text (A-F grading)
    - Update scoring function to use letter grades
    - Add proper error handling and NULL checks
    
  2. Scoring Rules
    - A: <= 2 minutes
    - B: 2-4 minutes
    - C: 4-6 minutes
    - D: 6-8 minutes
    - F: > 8 minutes or > 10 minutes
*/

-- First modify the score column type
ALTER TABLE gfe_timings 
ALTER COLUMN score TYPE text USING 
  CASE 
    WHEN score::text ~ '^[0-9]+$' THEN  -- Check if score is a valid number
      CASE
        WHEN score::integer >= 90 THEN 'A'
        WHEN score::integer >= 80 THEN 'B'
        WHEN score::integer >= 70 THEN 'C'
        WHEN score::integer >= 60 THEN 'D'
        ELSE 'F'
      END
    ELSE score  -- Keep existing text values as is
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
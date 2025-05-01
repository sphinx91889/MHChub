/*
  # Create get_user_role function

  1. Function
    - Creates a stored procedure to safely get a user's role
    - Returns the role as text (instead of the enum type for better compatibility)
    - Handles the case where the user doesn't exist

  2. Security
    - Function is accessible to authenticated users only
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Create the function
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role::text
    FROM users
    WHERE id = user_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
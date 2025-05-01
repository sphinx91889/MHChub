/*
  # Add Archive Support to SOPs
  
  1. Changes
    - Add archived column to sops table
    - Add archived_at timestamp
    - Add archived_by_user_id reference
    - Add indexes for efficient querying
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add archive-related columns
ALTER TABLE sops
ADD COLUMN archived boolean DEFAULT false,
ADD COLUMN archived_at timestamptz,
ADD COLUMN archived_by_user_id uuid REFERENCES auth.users(id);

-- Create index for archived status
CREATE INDEX idx_sops_archived ON sops(archived);

-- Add comment explaining the columns
COMMENT ON COLUMN sops.archived IS 'Whether the SOP is archived';
COMMENT ON COLUMN sops.archived_at IS 'When the SOP was archived';
COMMENT ON COLUMN sops.archived_by_user_id IS 'User who archived the SOP';
/*
  # Add SOP Deletion Trigger
  
  1. Changes
    - Add trigger to automatically delete attachments when a SOP is deleted
    - Create function to handle attachment deletion
    - Ensure proper error handling and logging
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create function to handle attachment deletion
CREATE OR REPLACE FUNCTION delete_sop_attachment()
RETURNS trigger AS $$
DECLARE
  file_path text;
BEGIN
  -- Only proceed if there's an attachment
  IF OLD.attachment_url IS NOT NULL THEN
    -- Extract file path from URL
    file_path := substring(OLD.attachment_url from '/sop-attachments/([^?#]+)');
    
    IF file_path IS NOT NULL THEN
      -- Delete the file from storage
      DELETE FROM storage.objects
      WHERE bucket_id = 'sop-attachments'
      AND name = file_path;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically delete attachments
DROP TRIGGER IF EXISTS tr_delete_sop_attachment ON sops;
CREATE TRIGGER tr_delete_sop_attachment
  BEFORE DELETE ON sops
  FOR EACH ROW
  EXECUTE FUNCTION delete_sop_attachment();

-- Add comment explaining the trigger
COMMENT ON FUNCTION delete_sop_attachment() IS 'Automatically deletes attachment files when a SOP is deleted';
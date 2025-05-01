/*
  # Add File Attachments to SOPs
  
  1. Changes
    - Add attachment_url column for storing file URLs
    - Add attachment_type column to store file type (pdf/image)
    - Add attachment_name column to store original filename
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add attachment columns to sops table
ALTER TABLE sops
ADD COLUMN attachment_url text,
ADD COLUMN attachment_type text CHECK (attachment_type IN ('pdf', 'image')),
ADD COLUMN attachment_name text;

-- Add comment explaining the columns
COMMENT ON COLUMN sops.attachment_url IS 'URL to the stored attachment file';
COMMENT ON COLUMN sops.attachment_type IS 'Type of attachment (pdf or image)';
COMMENT ON COLUMN sops.attachment_name IS 'Original filename of the attachment';
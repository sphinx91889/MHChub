/*
  # Add Contract Task Support
  
  1. Changes
    - Add contract_status field to tasks table
    - Add contract_signed_at timestamp
    - Add contract_url field for document reference
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add contract-related fields to tasks table
ALTER TABLE tasks
ADD COLUMN contract_status text CHECK (contract_status IN ('pending', 'sent', 'signed', 'expired')) DEFAULT 'pending',
ADD COLUMN contract_signed_at timestamptz,
ADD COLUMN contract_url text;

-- Create index for contract status
CREATE INDEX idx_tasks_contract_status ON tasks(contract_status);

-- Add comment explaining contract fields
COMMENT ON COLUMN tasks.contract_status IS 'Status of contract signing process';
COMMENT ON COLUMN tasks.contract_signed_at IS 'When the contract was signed';
COMMENT ON COLUMN tasks.contract_url IS 'URL to the signed contract document';
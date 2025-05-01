/*
  # Task Management System Updates
  
  1. Changes
    - Add priority field to tasks table
    - Add category field for task organization
    - Add task_notes table for comments/updates
    - Add indexes for better performance
    
  2. Security
    - Maintain existing RLS policies
    - Add policies for task notes
*/

-- Add new columns to tasks table
ALTER TABLE tasks
ADD COLUMN priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
ADD COLUMN category text CHECK (category IN ('client', 'internal', 'follow-up', 'other')) DEFAULT 'other';

-- Create task_notes table
CREATE TABLE IF NOT EXISTS task_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id);

-- Enable RLS on task_notes
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

-- Add policies for task_notes
CREATE POLICY "Users can read notes for tasks they can access"
  ON task_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_notes.task_id
      AND (
        tasks.assigned_to_user_id = auth.uid() OR
        tasks.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can manage notes they created"
  ON task_notes
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
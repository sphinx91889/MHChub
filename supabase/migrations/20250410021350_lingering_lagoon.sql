/*
  # Fix Task Management System

  1. Changes
    - Drop existing tasks table if it exists
    - Create tasks table with all required columns
    - Create task_notes table
    - Add proper indexes
    - Set up RLS policies
    
  2. Security
    - Enable RLS on both tables
    - Add policies for task and note management
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS task_notes;
DROP TABLE IF EXISTS tasks;

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date timestamptz,
  assigned_to_user_id uuid REFERENCES auth.users(id),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category text DEFAULT 'other' CHECK (category IN ('client', 'internal', 'follow-up', 'other'))
);

-- Create task_notes table
CREATE TABLE task_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_notes_task_id ON task_notes(task_id);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can read assigned tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_user_id = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage tasks they created"
  ON tasks
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Create policies for task_notes
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

-- Add comments
COMMENT ON TABLE tasks IS 'Stores task information and metadata';
COMMENT ON TABLE task_notes IS 'Stores notes and comments related to tasks';
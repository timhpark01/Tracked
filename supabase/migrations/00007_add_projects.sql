-- Migration: Add Projects table between Activities and Logs
-- Projects are required - each Activity must have at least one Project
-- Logs now belong to Projects instead of directly to Activities

-- 1. Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX idx_projects_activity_id ON projects(activity_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- 3. Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view projects of public users" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = projects.user_id
      AND profiles.is_public = true
    )
  );

CREATE POLICY "Users can view projects of users they follow" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM follows
      WHERE follows.following_id = projects.user_id
      AND follows.follower_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Add project_id column to activity_logs (nullable initially for migration)
ALTER TABLE activity_logs ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- 6. Create index on project_id
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);

-- 7. Create "General" project for each existing activity
INSERT INTO projects (activity_id, user_id, name)
SELECT id, user_id, 'General' FROM activities;

-- 8. Migrate existing logs to their activity's "General" project
UPDATE activity_logs
SET project_id = (
  SELECT p.id FROM projects p
  WHERE p.activity_id = activity_logs.activity_id
  AND p.name = 'General'
  LIMIT 1
)
WHERE project_id IS NULL;

-- 9. Make project_id required now that all logs have been migrated
ALTER TABLE activity_logs ALTER COLUMN project_id SET NOT NULL;

-- 10. Remove goal_total from activities (goals are being removed)
ALTER TABLE activities DROP COLUMN IF EXISTS goal_total;

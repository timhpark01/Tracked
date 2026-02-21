-- Add color column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;

-- Set default colors for existing projects
-- General projects get a neutral gray, others get blue
UPDATE projects
SET color = CASE
  WHEN name = 'General' THEN '#6b7280'
  ELSE '#007AFF'
END
WHERE color IS NULL;

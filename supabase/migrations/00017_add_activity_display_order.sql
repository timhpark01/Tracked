-- Add display_order column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial display_order based on created_at (oldest first = lowest number)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM activities
)
UPDATE activities
SET display_order = ordered.rn
FROM ordered
WHERE activities.id = ordered.id;

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_activities_user_display_order
ON activities(user_id, display_order);

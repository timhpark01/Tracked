-- ============================================================================
-- REMOVE TRACKING TYPE FROM ACTIVITIES
-- Version: 00005
-- Description: Remove tracking_type and goal_unit columns from activities table
-- All activities now track time only (value in minutes, goal in hours)
-- ============================================================================

-- Drop the tracking_type and goal_unit columns
ALTER TABLE activities DROP COLUMN IF EXISTS tracking_type;
ALTER TABLE activities DROP COLUMN IF EXISTS goal_unit;

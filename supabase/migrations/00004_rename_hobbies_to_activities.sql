-- ============================================================================
-- MIGRATION: Rename hobbies to activities
-- Version: 00004
-- Description: Renames hobbies table to activities and hobby_logs to activity_logs
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES ON HOBBY_LOGS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own logs" ON hobby_logs;
DROP POLICY IF EXISTS "Followers can view logs" ON hobby_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON hobby_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON hobby_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON hobby_logs;

-- ============================================================================
-- STEP 2: DROP EXISTING POLICIES ON HOBBIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own hobbies" ON hobbies;
DROP POLICY IF EXISTS "Public hobbies are viewable" ON hobbies;
DROP POLICY IF EXISTS "Users can insert own hobbies" ON hobbies;
DROP POLICY IF EXISTS "Users can update own hobbies" ON hobbies;
DROP POLICY IF EXISTS "Users can delete own hobbies" ON hobbies;

-- ============================================================================
-- STEP 3: DROP EXISTING INDEXES
-- ============================================================================
DROP INDEX IF EXISTS idx_hobby_logs_id;
DROP INDEX IF EXISTS idx_hobby_logs_user_id;
DROP INDEX IF EXISTS idx_hobby_logs_hobby_id;
DROP INDEX IF EXISTS idx_hobby_logs_logged_at;
DROP INDEX IF EXISTS idx_hobby_logs_created_at;
DROP INDEX IF EXISTS idx_hobbies_id;
DROP INDEX IF EXISTS idx_hobbies_user_id;

-- ============================================================================
-- STEP 4: RENAME TABLES AND COLUMNS
-- ============================================================================
ALTER TABLE hobby_logs RENAME TO activity_logs;
ALTER TABLE hobbies RENAME TO activities;
ALTER TABLE activity_logs RENAME COLUMN hobby_id TO activity_id;

-- ============================================================================
-- STEP 5: RECREATE INDEXES WITH NEW NAMES
-- ============================================================================
CREATE INDEX idx_activities_id ON activities(id);
CREATE INDEX idx_activities_user_id ON activities(user_id);

CREATE INDEX idx_activity_logs_id ON activity_logs(id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_id ON activity_logs(activity_id);
CREATE INDEX idx_activity_logs_logged_at ON activity_logs(logged_at DESC);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================================
-- STEP 6: RECREATE POLICIES FOR ACTIVITIES
-- ============================================================================

-- Policy: Users can view their own activities
CREATE POLICY "Users can view own activities"
ON activities FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy: Anyone can view activities of public profiles
CREATE POLICY "Public activities are viewable"
ON activities FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = activities.user_id
    AND profiles.is_public = true
  )
);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert own activities"
ON activities FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own activities
CREATE POLICY "Users can update own activities"
ON activities FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own activities
CREATE POLICY "Users can delete own activities"
ON activities FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- STEP 7: RECREATE POLICIES FOR ACTIVITY_LOGS
-- ============================================================================

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs"
ON activity_logs FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy: Followers can view logs (owner is public OR viewer follows owner)
CREATE POLICY "Followers can view logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
  -- Owner is public
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = activity_logs.user_id
    AND profiles.is_public = true
  )
  OR
  -- Viewer follows owner
  EXISTS (
    SELECT 1 FROM follows
    WHERE follows.following_id = activity_logs.user_id
    AND follows.follower_id = (SELECT auth.uid())
  )
);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own logs
CREATE POLICY "Users can update own logs"
ON activity_logs FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own logs
CREATE POLICY "Users can delete own logs"
ON activity_logs FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

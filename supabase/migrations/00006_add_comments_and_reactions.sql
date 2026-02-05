-- ============================================================================
-- MIGRATION: Add Comments and Reactions (Gudos)
-- Version: 00005
-- Description: Adds tables for social interactions on activity logs
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE REACTIONS TABLE (GUDOS)
-- ============================================================================
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_log_id UUID NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_log_id, user_id)  -- One gudo per user per log
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_reactions_activity_log_id ON reactions(activity_log_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_created_at ON reactions(created_at DESC);

-- ============================================================================
-- STEP 2: CREATE COMMENTS TABLE (WITH THREADING)
-- ============================================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_log_id UUID NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,  -- NULL for top-level, comment ID for replies
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_comments_activity_log_id ON comments(activity_log_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ============================================================================
-- STEP 3: RLS POLICIES FOR REACTIONS
-- ============================================================================

-- Policy: Users can view reactions on logs they can see (public profiles or followed users)
CREATE POLICY "Users can view reactions"
ON reactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM activity_logs al
    JOIN profiles p ON p.id = al.user_id
    WHERE al.id = reactions.activity_log_id
    AND (
      p.is_public = true
      OR al.user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM follows
        WHERE follows.following_id = al.user_id
        AND follows.follower_id = (SELECT auth.uid())
      )
    )
  )
);

-- Policy: Authenticated users can create reactions
CREATE POLICY "Users can create reactions"
ON reactions FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
ON reactions FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- STEP 4: RLS POLICIES FOR COMMENTS
-- ============================================================================

-- Policy: Users can view comments on logs they can see
CREATE POLICY "Users can view comments"
ON comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM activity_logs al
    JOIN profiles p ON p.id = al.user_id
    WHERE al.id = comments.activity_log_id
    AND (
      p.is_public = true
      OR al.user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM follows
        WHERE follows.following_id = al.user_id
        AND follows.follower_id = (SELECT auth.uid())
      )
    )
  )
);

-- Policy: Authenticated users can create comments
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

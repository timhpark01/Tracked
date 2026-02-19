-- FIX ALL GROUP POLICIES - Eliminate cross-table recursion
-- The issue: groups SELECT checks group_members, group_members SELECT checks groups

-- =============================================
-- DROP ALL POLICIES ON BOTH TABLES
-- =============================================

-- Drop all policies on groups
DROP POLICY IF EXISTS "Discoverable groups are viewable" ON groups;
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;

-- Drop all policies on group_members
DROP POLICY IF EXISTS "View group members" ON group_members;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can delete own membership" ON group_members;
DROP POLICY IF EXISTS "Users can join open groups" ON group_members;
DROP POLICY IF EXISTS "Users can self-join open groups" ON group_members;
DROP POLICY IF EXISTS "Admins can add members" ON group_members;
DROP POLICY IF EXISTS "Admins can add other members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON group_members;
DROP POLICY IF EXISTS "Service can add approved members" ON group_members;
DROP POLICY IF EXISTS "Approved requests can join" ON group_members;
DROP POLICY IF EXISTS "Accepted invites can join" ON group_members;

-- =============================================
-- GROUPS POLICIES (No reference to group_members)
-- =============================================

-- SELECT: Anyone can view discoverable groups
CREATE POLICY "groups_select_discoverable"
ON groups FOR SELECT
TO authenticated
USING (is_discoverable = true);

-- SELECT: Creators can always see their own groups
CREATE POLICY "groups_select_own"
ON groups FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- INSERT: Users can create groups (handled by RPC, but allow direct too)
CREATE POLICY "groups_insert"
ON groups FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

-- UPDATE: Only creator can update
CREATE POLICY "groups_update"
ON groups FOR UPDATE
TO authenticated
USING (creator_id = auth.uid());

-- DELETE: Only creator can delete
CREATE POLICY "groups_delete"
ON groups FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

-- =============================================
-- GROUP_MEMBERS POLICIES (No reference to groups)
-- =============================================

-- SELECT: Users can see their own memberships
CREATE POLICY "group_members_select_own"
ON group_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: Users can see other members of groups they're in
-- This uses a simple subquery that doesn't trigger groups policies
CREATE POLICY "group_members_select_same_group"
ON group_members FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
  )
);

-- DELETE: Users can remove themselves
CREATE POLICY "group_members_delete_self"
ON group_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- No INSERT policy - all inserts go through SECURITY DEFINER RPC functions
-- No UPDATE policy - role changes would go through RPC functions

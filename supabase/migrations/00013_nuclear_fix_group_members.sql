-- NUCLEAR FIX: Drop ALL policies on group_members and start fresh
-- This ensures no leftover policies are causing recursion

-- Drop ALL existing policies on group_members (by name patterns we might have used)
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
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

-- Drop any trigger on groups that might interfere
DROP TRIGGER IF EXISTS on_group_created ON groups;
DROP TRIGGER IF EXISTS on_member_change ON group_members;
DROP FUNCTION IF EXISTS public.handle_new_group();
DROP FUNCTION IF EXISTS public.update_group_member_count();

-- Drop existing RPC functions to recreate them cleanly
DROP FUNCTION IF EXISTS public.create_group_with_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.join_open_group(UUID);
DROP FUNCTION IF EXISTS public.leave_group(UUID);
DROP FUNCTION IF EXISTS public.approve_join_request(UUID);
DROP FUNCTION IF EXISTS public.reject_join_request(UUID);
DROP FUNCTION IF EXISTS public.accept_group_invite(UUID);

-- =============================================
-- RECREATE RPC FUNCTIONS (SECURITY DEFINER)
-- These bypass RLS completely
-- =============================================

CREATE OR REPLACE FUNCTION public.create_group_with_admin(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_membership_type TEXT DEFAULT 'open',
  p_is_discoverable BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create group
  INSERT INTO groups (creator_id, name, description, avatar_url, membership_type, is_discoverable, member_count)
  VALUES (v_user_id, p_name, p_description, p_avatar_url, p_membership_type, p_is_discoverable, 1)
  RETURNING id INTO v_group_id;

  -- Add creator as admin
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  RETURN v_group_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_open_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_membership_type TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT membership_type INTO v_membership_type FROM groups WHERE id = p_group_id;
  IF v_membership_type IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;
  IF v_membership_type != 'open' THEN
    RAISE EXCEPTION 'Group is not open';
  END IF;
  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  INSERT INTO group_members (group_id, user_id, role) VALUES (p_group_id, v_user_id, 'member');
  UPDATE groups SET member_count = member_count + 1 WHERE id = p_group_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT role INTO v_role FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not a member';
  END IF;
  IF v_role = 'admin' AND (SELECT COUNT(*) FROM group_members WHERE group_id = p_group_id AND role = 'admin') = 1 THEN
    RAISE EXCEPTION 'Cannot leave as only admin';
  END IF;

  DELETE FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id;
  UPDATE groups SET member_count = member_count - 1 WHERE id = p_group_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_join_request(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_user_id UUID;
  v_responder_id UUID;
BEGIN
  v_responder_id := auth.uid();

  SELECT group_id, user_id INTO v_group_id, v_user_id
  FROM group_join_requests WHERE id = p_request_id AND status = 'pending';

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = v_group_id AND user_id = v_responder_id AND role IN ('admin', 'moderator')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE group_join_requests SET status = 'approved', responded_at = NOW(), responded_by = v_responder_id WHERE id = p_request_id;
  INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_user_id, 'member');
  UPDATE groups SET member_count = member_count + 1 WHERE id = v_group_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_join_request(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_responder_id UUID;
BEGIN
  v_responder_id := auth.uid();

  SELECT group_id INTO v_group_id FROM group_join_requests WHERE id = p_request_id AND status = 'pending';
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = v_group_id AND user_id = v_responder_id AND role IN ('admin', 'moderator')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE group_join_requests SET status = 'rejected', responded_at = NOW(), responded_by = v_responder_id WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_group_invite(p_invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_invited_user_id UUID;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  SELECT group_id, invited_user_id INTO v_group_id, v_invited_user_id
  FROM group_invites WHERE id = p_invite_id AND status = 'pending';

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;
  IF v_invited_user_id != v_current_user_id THEN
    RAISE EXCEPTION 'Not your invite';
  END IF;

  UPDATE group_invites SET status = 'accepted', responded_at = NOW() WHERE id = p_invite_id;
  INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_current_user_id, 'member');
  UPDATE groups SET member_count = member_count + 1 WHERE id = v_group_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_group_with_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_open_group(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_join_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_join_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_group_invite(UUID) TO authenticated;

-- =============================================
-- SIMPLE RLS POLICIES (NO RECURSION)
-- All write operations go through RPC functions
-- These policies are READ-ONLY or simple self-operations
-- =============================================

-- SELECT: Members can view members of groups they're in, or discoverable groups
CREATE POLICY "View group members"
ON group_members FOR SELECT
TO authenticated
USING (
  -- Can always see members of discoverable groups
  (SELECT is_discoverable FROM groups WHERE id = group_id) = true
  OR
  -- Or if you're a member (simple user_id check, no recursion)
  user_id = auth.uid()
);

-- DELETE: Users can only delete their own membership (leaving handled by RPC, this is backup)
CREATE POLICY "Users can delete own membership"
ON group_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Disabled for direct inserts - all inserts go through RPC functions
-- No INSERT policy = no direct inserts allowed (RPC functions use SECURITY DEFINER to bypass)

-- UPDATE: No direct updates allowed
-- Role changes would go through a separate RPC function if needed

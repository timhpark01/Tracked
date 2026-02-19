-- Remove trigger approach entirely and use a database function instead

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_group_created ON groups;
DROP FUNCTION IF EXISTS public.handle_new_group();

-- Drop all INSERT policies on group_members to start fresh
DROP POLICY IF EXISTS "Users can join open groups" ON group_members;
DROP POLICY IF EXISTS "Service can add approved members" ON group_members;
DROP POLICY IF EXISTS "Admins can add members" ON group_members;
DROP POLICY IF EXISTS "Admins can add other members" ON group_members;

-- Create a function to create a group with creator as admin
-- This function bypasses RLS completely
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
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the group
  INSERT INTO groups (creator_id, name, description, avatar_url, membership_type, is_discoverable, member_count)
  VALUES (v_user_id, p_name, p_description, p_avatar_url, p_membership_type, p_is_discoverable, 1)
  RETURNING id INTO v_group_id;

  -- Add creator as admin (this bypasses RLS because of SECURITY DEFINER)
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  RETURN v_group_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_group_with_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Create simple, non-recursive INSERT policies for group_members

-- Users can join open groups (only as member, only themselves)
CREATE POLICY "Users can self-join open groups"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'member'
  AND (SELECT membership_type FROM groups WHERE id = group_id) = 'open'
);

-- Members can be added when they have an approved request
CREATE POLICY "Approved requests can join"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  role = 'member'
  AND EXISTS (
    SELECT 1 FROM group_join_requests gjr
    WHERE gjr.group_id = group_members.group_id
    AND gjr.user_id = group_members.user_id
    AND gjr.status = 'approved'
  )
);

-- Members can be added when they accepted an invite
CREATE POLICY "Accepted invites can join"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  role = 'member'
  AND EXISTS (
    SELECT 1 FROM group_invites gi
    WHERE gi.group_id = group_members.group_id
    AND gi.invited_user_id = group_members.user_id
    AND gi.status = 'accepted'
  )
);

-- Function to approve a join request and add member atomically
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

  -- Get request details
  SELECT group_id, user_id INTO v_group_id, v_user_id
  FROM group_join_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Verify responder is admin/moderator
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group_id
    AND user_id = v_responder_id
    AND role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Not authorized to approve requests';
  END IF;

  -- Update request status
  UPDATE group_join_requests
  SET status = 'approved', responded_at = NOW(), responded_by = v_responder_id
  WHERE id = p_request_id;

  -- Add member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'member');

  -- Update member count
  UPDATE groups SET member_count = member_count + 1 WHERE id = v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_join_request(UUID) TO authenticated;

-- Function to reject a join request
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

  -- Get request details
  SELECT group_id INTO v_group_id
  FROM group_join_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Verify responder is admin/moderator
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group_id
    AND user_id = v_responder_id
    AND role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Not authorized to reject requests';
  END IF;

  -- Update request status
  UPDATE group_join_requests
  SET status = 'rejected', responded_at = NOW(), responded_by = v_responder_id
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_join_request(UUID) TO authenticated;

-- Function to accept an invite
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

  -- Get invite details
  SELECT group_id, invited_user_id INTO v_group_id, v_invited_user_id
  FROM group_invites
  WHERE id = p_invite_id AND status = 'pending';

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invite not found or already processed';
  END IF;

  -- Verify current user is the invited user
  IF v_invited_user_id != v_current_user_id THEN
    RAISE EXCEPTION 'Not authorized to accept this invite';
  END IF;

  -- Update invite status
  UPDATE group_invites
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_invite_id;

  -- Add member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_current_user_id, 'member');

  -- Update member count
  UPDATE groups SET member_count = member_count + 1 WHERE id = v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_group_invite(UUID) TO authenticated;

-- Function to join an open group
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

  -- Check group exists and is open
  SELECT membership_type INTO v_membership_type
  FROM groups
  WHERE id = p_group_id;

  IF v_membership_type IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF v_membership_type != 'open' THEN
    RAISE EXCEPTION 'This group is not open for direct joining';
  END IF;

  -- Check not already a member
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Already a member of this group';
  END IF;

  -- Add member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, v_user_id, 'member');

  -- Update member count
  UPDATE groups SET member_count = member_count + 1 WHERE id = p_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_open_group(UUID) TO authenticated;

-- Function to leave a group
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

  -- Check membership and get role
  SELECT role INTO v_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = v_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- Prevent last admin from leaving
  IF v_role = 'admin' THEN
    IF (SELECT COUNT(*) FROM group_members WHERE group_id = p_group_id AND role = 'admin') = 1 THEN
      RAISE EXCEPTION 'Cannot leave as the only admin. Transfer admin role first or delete the group.';
    END IF;
  END IF;

  -- Remove member
  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = v_user_id;

  -- Update member count
  UPDATE groups SET member_count = member_count - 1 WHERE id = p_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_group(UUID) TO authenticated;

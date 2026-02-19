-- Migration: Add Groups Feature
-- Tables: groups, group_members, group_join_requests, group_invites

-- ============================================
-- TABLES
-- ============================================

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('open', 'request', 'invite')),
  is_discoverable BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group join requests table (for request-based groups)
CREATE TABLE group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES profiles(id),
  UNIQUE(group_id, user_id)
);

-- Group invites table (for invite-only groups)
CREATE TABLE group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(group_id, invited_user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_groups_creator_id ON groups(creator_id);
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_membership_type ON groups(membership_type);
CREATE INDEX idx_groups_is_discoverable ON groups(is_discoverable) WHERE is_discoverable = true;

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);

CREATE INDEX idx_group_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX idx_group_join_requests_user_id ON group_join_requests(user_id);
CREATE INDEX idx_group_join_requests_status ON group_join_requests(status) WHERE status = 'pending';

CREATE INDEX idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX idx_group_invites_invited_user_id ON group_invites(invited_user_id);
CREATE INDEX idx_group_invites_status ON group_invites(status) WHERE status = 'pending';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-add creator as admin when group is created
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');

  -- Initialize member count to 1
  UPDATE public.groups SET member_count = 1 WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

-- Update member count when members join/leave
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_member_change
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- GROUPS POLICIES

-- Anyone can view discoverable groups
CREATE POLICY "Discoverable groups are viewable"
ON groups FOR SELECT
TO authenticated
USING (is_discoverable = true);

-- Members can view their groups (including non-discoverable)
CREATE POLICY "Members can view their groups"
ON groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

-- Authenticated users can create groups
CREATE POLICY "Users can create groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = creator_id);

-- Admins can update their groups
CREATE POLICY "Admins can update groups"
ON groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = (SELECT auth.uid())
    AND group_members.role = 'admin'
  )
);

-- Admins can delete their groups
CREATE POLICY "Admins can delete groups"
ON groups FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = (SELECT auth.uid())
    AND group_members.role = 'admin'
  )
);

-- GROUP MEMBERS POLICIES

-- Members can view other members of their groups (or discoverable groups)
CREATE POLICY "Members can view group members"
ON group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members AS my_membership
    WHERE my_membership.group_id = group_members.group_id
    AND my_membership.user_id = (SELECT auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.is_discoverable = true
  )
);

-- Users can join open groups
CREATE POLICY "Users can join open groups"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND role = 'member'
  AND EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.membership_type = 'open'
  )
);

-- Admins/moderators can add members (for approved requests or invites)
CREATE POLICY "Admins can add members"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members AS admin_check
    WHERE admin_check.group_id = group_members.group_id
    AND admin_check.user_id = (SELECT auth.uid())
    AND admin_check.role IN ('admin', 'moderator')
  )
);

-- Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups"
ON group_members FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Admins can remove members
CREATE POLICY "Admins can remove members"
ON group_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members AS admin_check
    WHERE admin_check.group_id = group_members.group_id
    AND admin_check.user_id = (SELECT auth.uid())
    AND admin_check.role = 'admin'
  )
  AND user_id != (SELECT auth.uid()) -- Can't remove self via this policy
);

-- GROUP JOIN REQUESTS POLICIES

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON group_join_requests FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Admins can view requests for their groups
CREATE POLICY "Admins can view group requests"
ON group_join_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_join_requests.group_id
    AND group_members.user_id = (SELECT auth.uid())
    AND group_members.role IN ('admin', 'moderator')
  )
);

-- Users can create join requests
CREATE POLICY "Users can request to join"
ON group_join_requests FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_join_requests.group_id
    AND groups.membership_type = 'request'
  )
);

-- Admins can update request status
CREATE POLICY "Admins can respond to requests"
ON group_join_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_join_requests.group_id
    AND group_members.user_id = (SELECT auth.uid())
    AND group_members.role IN ('admin', 'moderator')
  )
);

-- GROUP INVITES POLICIES

-- Invited users can view their invites
CREATE POLICY "Users can view their invites"
ON group_invites FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = invited_user_id);

-- Admins can view invites for their groups
CREATE POLICY "Admins can view group invites"
ON group_invites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_invites.group_id
    AND group_members.user_id = (SELECT auth.uid())
    AND group_members.role IN ('admin', 'moderator')
  )
);

-- Admins can create invites
CREATE POLICY "Admins can send invites"
ON group_invites FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = invited_by
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_invites.group_id
    AND group_members.user_id = (SELECT auth.uid())
    AND group_members.role IN ('admin', 'moderator')
  )
);

-- Invited users can update their invite status
CREATE POLICY "Users can respond to invites"
ON group_invites FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = invited_user_id);

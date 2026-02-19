-- Fix infinite recursion in group_members RLS policies
-- The issue: trigger inserting creator as admin triggers RLS policies that query group_members

-- Step 1: Drop problematic policies
DROP POLICY IF EXISTS "Users can join open groups" ON group_members;
DROP POLICY IF EXISTS "Admins can add members" ON group_members;

-- Step 2: Recreate trigger function with proper RLS bypass
DROP TRIGGER IF EXISTS on_group_created ON groups;
DROP FUNCTION IF EXISTS public.handle_new_group();

CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this operation
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');

  UPDATE public.groups SET member_count = 1 WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_group() TO authenticated;

CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

-- Step 3: Create simplified, non-recursive policies

-- Policy for users joining open groups themselves
CREATE POLICY "Users can join open groups"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND role = 'member'
  AND EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_id
    AND groups.membership_type = 'open'
  )
);

-- Policy for service-level member additions (approved requests, accepted invites)
-- These happen through SECURITY DEFINER functions in the service layer
-- We need a permissive policy for the membership service functions
CREATE POLICY "Service can add approved members"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  role = 'member'
  AND (
    -- Either joining via approved request
    EXISTS (
      SELECT 1 FROM group_join_requests
      WHERE group_join_requests.group_id = group_id
      AND group_join_requests.user_id = group_members.user_id
      AND group_join_requests.status = 'approved'
    )
    OR
    -- Or joining via accepted invite
    EXISTS (
      SELECT 1 FROM group_invites
      WHERE group_invites.group_id = group_id
      AND group_invites.invited_user_id = group_members.user_id
      AND group_invites.status = 'accepted'
    )
  )
);

-- Policy for admins updating member roles
CREATE POLICY "Admins can update member roles"
ON group_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members admin_check
    WHERE admin_check.group_id = group_members.group_id
    AND admin_check.user_id = (SELECT auth.uid())
    AND admin_check.role = 'admin'
    AND admin_check.id != group_members.id
  )
);

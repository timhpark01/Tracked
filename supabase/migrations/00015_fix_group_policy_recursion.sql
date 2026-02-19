-- Fix group policy recursion issues
-- Problem 1: group_members_select_same_group has self-referential subquery
-- Problem 2: groups needs a policy for members to view their groups

-- Step 1: Create SECURITY DEFINER function to get user's group IDs without triggering RLS
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

-- Step 2: Fix group_members policy
DROP POLICY IF EXISTS "group_members_select_same_group" ON group_members;

CREATE POLICY "group_members_select_same_group"
ON group_members FOR SELECT
TO authenticated
USING (group_id IN (SELECT get_my_group_ids()));

-- Step 3: Add policy for members to view their groups
CREATE POLICY "groups_select_member"
ON groups FOR SELECT
TO authenticated
USING (id IN (SELECT get_my_group_ids()));

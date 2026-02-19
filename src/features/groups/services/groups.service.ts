// src/features/groups/services/groups.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Group = Database['public']['Tables']['groups']['Row']
export type GroupInsert = Database['public']['Tables']['groups']['Insert']
export type GroupUpdate = Database['public']['Tables']['groups']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']

export type GroupWithCreator = Group & {
  creator: Profile
}

/**
 * Get a single group by ID with creator profile
 */
export async function getGroup(groupId: string): Promise<GroupWithCreator> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, creator:profiles!groups_creator_id_fkey(*)')
    .eq('id', groupId)
    .single()

  if (error) throw error
  return data as GroupWithCreator
}

/**
 * Get all groups a user is a member of
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group:groups(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => row.group as unknown as Group)
}

/**
 * Search for discoverable groups by name prefix
 */
export async function searchGroups(
  query: string,
  limit = 20
): Promise<Group[]> {
  if (query.length < 2) return []

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('is_discoverable', true)
    .ilike('name', `${query}%`)
    .order('member_count', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * Create a new group (uses database function to handle admin creation)
 */
export async function createGroup(group: GroupInsert): Promise<Group> {
  console.log('[createGroup] Starting with:', {
    name: group.name,
    membership_type: group.membership_type,
  })

  // Use the database function that handles both group and admin creation
  const { data: groupId, error: rpcError } = await supabase.rpc(
    'create_group_with_admin',
    {
      p_name: group.name,
      p_description: group.description ?? null,
      p_avatar_url: group.avatar_url ?? null,
      p_membership_type: group.membership_type,
      p_is_discoverable: group.is_discoverable ?? true,
    }
  )

  console.log('[createGroup] RPC result:', { groupId, rpcError })

  if (rpcError) throw rpcError

  // Fetch and return the created group
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update a group
 */
export async function updateGroup(
  groupId: string,
  updates: GroupUpdate
): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)

  if (error) throw error
}

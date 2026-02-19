// src/features/groups/services/membership.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type JoinRequest = Database['public']['Tables']['group_join_requests']['Row']
export type GroupInvite = Database['public']['Tables']['group_invites']['Row']
export type Group = Database['public']['Tables']['groups']['Row']

export type GroupMemberWithProfile = GroupMember & {
  profile: Profile
}

export type JoinRequestWithProfile = JoinRequest & {
  profile: Profile
}

export type GroupInviteWithGroup = GroupInvite & {
  group: Group
}

/**
 * Get all members of a group with their profiles
 */
export async function getGroupMembers(
  groupId: string
): Promise<GroupMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profile:profiles!group_members_user_id_fkey(*)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as unknown as GroupMemberWithProfile[]
}

/**
 * Check if a user is a member of a group
 */
export async function checkMembership(
  groupId: string,
  userId: string
): Promise<GroupMember | null> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Join an open group directly
 */
export async function joinGroup(
  groupId: string,
  userId: string
): Promise<GroupMember> {
  const { error } = await supabase.rpc('join_open_group', {
    p_group_id: groupId,
  })

  if (error) throw error

  // Fetch and return the created membership
  const { data, error: fetchError } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError
  return data
}

/**
 * Leave a group
 */
export async function leaveGroup(
  groupId: string,
  _userId: string
): Promise<void> {
  const { error } = await supabase.rpc('leave_group', {
    p_group_id: groupId,
  })

  if (error) throw error
}

/**
 * Request to join a request-based group
 */
export async function requestToJoin(
  groupId: string,
  userId: string,
  message?: string
): Promise<JoinRequest> {
  const { data, error } = await supabase
    .from('group_join_requests')
    .insert({ group_id: groupId, user_id: userId, message })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get pending join requests for a group (admin view)
 */
export async function getPendingRequests(
  groupId: string
): Promise<JoinRequestWithProfile[]> {
  const { data, error } = await supabase
    .from('group_join_requests')
    .select('*, profile:profiles!group_join_requests_user_id_fkey(*)')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  if (error) throw error
  return data as unknown as JoinRequestWithProfile[]
}

/**
 * Check if a user has a pending join request
 */
export async function checkPendingRequest(
  groupId: string,
  userId: string
): Promise<JoinRequest | null> {
  const { data, error } = await supabase
    .from('group_join_requests')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Respond to a join request (approve or reject)
 */
export async function respondToRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  _responderId: string
): Promise<void> {
  if (status === 'approved') {
    const { error } = await supabase.rpc('approve_join_request', {
      p_request_id: requestId,
    })
    if (error) throw error
  } else {
    const { error } = await supabase.rpc('reject_join_request', {
      p_request_id: requestId,
    })
    if (error) throw error
  }
}

/**
 * Invite a user to a group
 */
export async function inviteToGroup(
  groupId: string,
  invitedUserId: string,
  invitedBy: string
): Promise<GroupInvite> {
  const { data, error } = await supabase
    .from('group_invites')
    .insert({
      group_id: groupId,
      invited_user_id: invitedUserId,
      invited_by: invitedBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get a user's pending invites
 */
export async function getUserInvites(
  userId: string
): Promise<GroupInviteWithGroup[]> {
  const { data, error } = await supabase
    .from('group_invites')
    .select('*, group:groups!group_invites_group_id_fkey(*)')
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
    .order('invited_at', { ascending: false })

  if (error) throw error
  return data as unknown as GroupInviteWithGroup[]
}

/**
 * Respond to an invite (accept or decline)
 */
export async function respondToInvite(
  inviteId: string,
  status: 'accepted' | 'declined',
  _userId: string
): Promise<void> {
  if (status === 'accepted') {
    const { error } = await supabase.rpc('accept_group_invite', {
      p_invite_id: inviteId,
    })
    if (error) throw error
  } else {
    // For decline, just update the invite status directly
    const { error } = await supabase
      .from('group_invites')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', inviteId)

    if (error) throw error
  }
}

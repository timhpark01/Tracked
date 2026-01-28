// src/features/social/services/social.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Follow = Database['public']['Tables']['follows']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Follow a user
 * @param followerId - The ID of the user who is following
 * @param followingId - The ID of the user being followed
 * @returns The created follow relationship
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<Follow> {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Unfollow a user
 * @param followerId - The ID of the user who is unfollowing
 * @param followingId - The ID of the user being unfollowed
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) throw error
}

/**
 * Get a user's followers
 * @param userId - The user ID to get followers for
 * @returns Array of profiles who follow this user
 */
export async function getFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  // Extract profile from nested structure
  return (data ?? []).map((row) => row.follower as unknown as Profile)
}

/**
 * Get users that a user is following
 * @param userId - The user ID to get following list for
 * @returns Array of profiles this user follows
 */
export async function getFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following:profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  // Extract profile from nested structure
  return (data ?? []).map((row) => row.following as unknown as Profile)
}

/**
 * Check if a user is following another user
 * @param followerId - The ID of the potential follower
 * @param followingId - The ID of the user potentially being followed
 * @returns True if followerId is following followingId
 */
export async function checkIsFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

/**
 * Search for users by username prefix
 * @param query - The search query (username prefix)
 * @param currentUserId - The current user's ID (to exclude from results)
 * @param limit - Maximum number of results (default 20)
 * @returns Array of matching profiles
 */
export async function searchUsers(
  query: string,
  currentUserId: string,
  limit = 20
): Promise<Profile[]> {
  // Require at least 2 characters for search
  if (query.length < 2) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `${query}%`)
    .neq('id', currentUserId)
    .order('username')
    .limit(limit)

  if (error) throw error
  return data ?? []
}

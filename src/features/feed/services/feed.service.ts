// src/features/feed/services/feed.service.ts
import { supabase } from '@/lib/supabase'

export type FeedLog = {
  id: string
  value: number
  note: string | null
  image_urls: string[] | null
  logged_at: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
  activity: {
    id: string
    name: string
  }
}

export type FeedType = 'public' | 'following'

const FEED_SELECT_QUERY = `
  id,
  value,
  note,
  image_urls,
  logged_at,
  user:profiles!inner (
    id,
    username,
    avatar_url
  ),
  activity:activities!inner (
    id,
    name
  )
`

/**
 * Fetch paginated feed logs for followed users
 * @param userId - Current user's ID (passed from AuthContext to avoid race conditions)
 * @param start - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, inclusive)
 * @returns Array of feed logs with nested user/activity data
 */
export async function getFeedLogs(userId: string, start: number, end: number): Promise<FeedLog[]> {
  // Get list of users the current user follows
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followingIds = following?.map(f => f.following_id) ?? []

  if (followingIds.length === 0) return []

  const { data, error } = await supabase
    .from('activity_logs')
    .select(FEED_SELECT_QUERY)
    .in('user_id', followingIds)
    .order('logged_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, end)

  if (error) throw error

  return (data ?? []) as unknown as FeedLog[]
}

/**
 * Fetch paginated public feed logs (all users)
 * @param start - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, inclusive)
 * @returns Array of feed logs with nested user/activity data
 */
export async function getPublicFeedLogs(start: number, end: number): Promise<FeedLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(FEED_SELECT_QUERY)
    .order('logged_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, end)

  if (error) throw error

  return (data ?? []) as unknown as FeedLog[]
}

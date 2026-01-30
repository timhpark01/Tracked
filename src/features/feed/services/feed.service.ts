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
  hobby: {
    id: string
    name: string
    tracking_type: 'time' | 'quantity'
    goal_unit: string | null
  }
}

export type FeedType = 'public' | 'following'

const FEED_SELECT_QUERY = `
  id,
  value,
  note,
  image_urls,
  logged_at,
  user:profiles!hobby_logs_user_id_fkey (
    id,
    username,
    avatar_url
  ),
  hobby:hobbies!hobby_logs_hobby_id_fkey (
    id,
    name,
    tracking_type,
    goal_unit
  )
`

/**
 * Fetch paginated feed logs for followed users
 * RLS policy "Followers can view logs" automatically filters results
 * @param start - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, inclusive)
 * @returns Array of feed logs with nested user/hobby data
 */
export async function getFeedLogs(start: number, end: number): Promise<FeedLog[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get list of users the current user follows
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = following?.map(f => f.following_id) ?? []

  if (followingIds.length === 0) return []

  const { data, error } = await supabase
    .from('hobby_logs')
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
 * @returns Array of feed logs with nested user/hobby data
 */
export async function getPublicFeedLogs(start: number, end: number): Promise<FeedLog[]> {
  const { data, error } = await supabase
    .from('hobby_logs')
    .select(FEED_SELECT_QUERY)
    .order('logged_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, end)

  if (error) throw error

  return (data ?? []) as unknown as FeedLog[]
}

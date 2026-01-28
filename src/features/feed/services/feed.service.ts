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

/**
 * Fetch paginated feed logs for followed users
 * RLS policy "Followers can view logs" automatically filters results
 * @param start - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, inclusive)
 * @returns Array of feed logs with nested user/hobby data
 */
export async function getFeedLogs(start: number, end: number): Promise<FeedLog[]> {
  const { data, error } = await supabase
    .from('hobby_logs')
    .select(`
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
    `)
    .order('logged_at', { ascending: false })
    .order('id', { ascending: false }) // Fallback for stable sort
    .range(start, end)

  if (error) throw error

  // Type assertion needed due to Supabase nested type limitations
  return (data ?? []) as unknown as FeedLog[]
}

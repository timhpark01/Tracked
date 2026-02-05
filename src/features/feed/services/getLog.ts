// src/features/feed/services/getLog.ts
import { supabase } from '@/lib/supabase'
import type { FeedLog } from './feed.service'

const LOG_SELECT_QUERY = `
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
 * Fetch a single activity log by ID
 */
export async function getLogById(logId: string): Promise<FeedLog | null> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(LOG_SELECT_QUERY)
    .eq('id', logId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data as unknown as FeedLog
}

// src/features/reactions/services/reactions.service.ts
import { supabase } from '@/lib/supabase'

export type ReactionInfo = {
  count: number
  hasReacted: boolean
}

/**
 * Get reaction count and whether current user has reacted for a log
 */
export async function getReactionInfo(activityLogId: string): Promise<ReactionInfo> {
  const { data: { user } } = await supabase.auth.getUser()

  // Get total count
  const { count, error: countError } = await supabase
    .from('reactions')
    .select('*', { count: 'exact', head: true })
    .eq('activity_log_id', activityLogId)

  if (countError) throw countError

  // Check if current user has reacted
  let hasReacted = false
  if (user) {
    const { data } = await supabase
      .from('reactions')
      .select('id')
      .eq('activity_log_id', activityLogId)
      .eq('user_id', user.id)
      .maybeSingle()

    hasReacted = !!data
  }

  return {
    count: count ?? 0,
    hasReacted,
  }
}

/**
 * Get reaction info for multiple logs at once (for feed optimization)
 */
export async function getReactionInfoBatch(activityLogIds: string[]): Promise<Record<string, ReactionInfo>> {
  const { data: { user } } = await supabase.auth.getUser()

  // Get all reactions for these logs
  const { data: reactions, error } = await supabase
    .from('reactions')
    .select('activity_log_id, user_id')
    .in('activity_log_id', activityLogIds)

  if (error) throw error

  // Process into counts and user reactions
  const result: Record<string, ReactionInfo> = {}

  for (const logId of activityLogIds) {
    const logReactions = reactions?.filter(r => r.activity_log_id === logId) ?? []
    result[logId] = {
      count: logReactions.length,
      hasReacted: user ? logReactions.some(r => r.user_id === user.id) : false,
    }
  }

  return result
}

/**
 * Toggle reaction (gudo) on a log - add if not exists, remove if exists
 */
export async function toggleReaction(activityLogId: string): Promise<{ added: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to react')

  // Check if reaction exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('activity_log_id', activityLogId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id)

    if (error) throw error
    return { added: false }
  } else {
    // Add reaction
    const { error } = await supabase
      .from('reactions')
      .insert({
        activity_log_id: activityLogId,
        user_id: user.id,
      })

    if (error) throw error
    return { added: true }
  }
}

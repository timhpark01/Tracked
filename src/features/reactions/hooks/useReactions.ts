// src/features/reactions/hooks/useReactions.ts
import { useQuery } from '@tanstack/react-query'
import { getReactionInfo, getReactionInfoBatch } from '../services/reactions.service'

/**
 * Get reaction info for a single activity log
 */
export function useReactions(activityLogId: string) {
  return useQuery({
    queryKey: ['reactions', activityLogId],
    queryFn: () => getReactionInfo(activityLogId),
    enabled: !!activityLogId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get reaction info for multiple activity logs (for feed)
 */
export function useReactionsBatch(activityLogIds: string[]) {
  return useQuery({
    queryKey: ['reactions-batch', activityLogIds.sort().join(',')],
    queryFn: () => getReactionInfoBatch(activityLogIds),
    enabled: activityLogIds.length > 0,
    staleTime: 30 * 1000,
  })
}

// src/features/comments/hooks/useCommentCount.ts
import { useQuery } from '@tanstack/react-query'
import { getCommentCount, getCommentCountBatch } from '../services/comments.service'

/**
 * Get comment count for a single activity log
 */
export function useCommentCount(activityLogId: string) {
  return useQuery({
    queryKey: ['comment-count', activityLogId],
    queryFn: () => getCommentCount(activityLogId),
    enabled: !!activityLogId,
    staleTime: 30 * 1000,
  })
}

/**
 * Get comment counts for multiple activity logs
 */
export function useCommentCountBatch(activityLogIds: string[]) {
  return useQuery({
    queryKey: ['comment-count-batch', activityLogIds.sort().join(',')],
    queryFn: () => getCommentCountBatch(activityLogIds),
    enabled: activityLogIds.length > 0,
    staleTime: 30 * 1000,
  })
}

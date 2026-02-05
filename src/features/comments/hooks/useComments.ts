// src/features/comments/hooks/useComments.ts
import { useQuery } from '@tanstack/react-query'
import { getComments, organizeCommentsIntoThreads } from '../services/comments.service'

/**
 * Get comments for an activity log, organized into threads
 */
export function useComments(activityLogId: string) {
  return useQuery({
    queryKey: ['comments', activityLogId],
    queryFn: async () => {
      const comments = await getComments(activityLogId)
      return organizeCommentsIntoThreads(comments)
    },
    enabled: !!activityLogId,
    staleTime: 30 * 1000,
  })
}

// src/features/comments/hooks/useDeleteComment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteComment } from '../services/comments.service'

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, activityLogId }: { commentId: string; activityLogId: string }) =>
      deleteComment(commentId),
    onSuccess: (_data, variables) => {
      // Invalidate comments list
      queryClient.invalidateQueries({ queryKey: ['comments', variables.activityLogId] })
      // Invalidate comment count
      queryClient.invalidateQueries({ queryKey: ['comment-count', variables.activityLogId] })
    },
  })
}

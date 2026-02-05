// src/features/comments/hooks/useCreateComment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment } from '../services/comments.service'

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComment,
    onSuccess: (data) => {
      // Invalidate comments list
      queryClient.invalidateQueries({ queryKey: ['comments', data.activity_log_id] })
      // Invalidate comment count
      queryClient.invalidateQueries({ queryKey: ['comment-count', data.activity_log_id] })
    },
  })
}

// src/features/reactions/hooks/useToggleReaction.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleReaction, ReactionInfo } from '../services/reactions.service'

export function useToggleReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleReaction,
    onMutate: async (activityLogId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reactions', activityLogId] })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ReactionInfo>(['reactions', activityLogId])

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<ReactionInfo>(['reactions', activityLogId], {
          count: previousData.hasReacted ? previousData.count - 1 : previousData.count + 1,
          hasReacted: !previousData.hasReacted,
        })
      }

      return { previousData, activityLogId }
    },
    onError: (_err, activityLogId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['reactions', activityLogId], context.previousData)
      }
    },
    onSettled: (_data, _error, activityLogId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['reactions', activityLogId] })
    },
  })
}

// src/features/social/hooks/useFollowUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { followUser } from '../services/social.service'

/**
 * Hook for following a user with optimistic update
 */
export function useFollowUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ followingId }: { followingId: string }) =>
      followUser(user!.id, followingId),
    onMutate: async ({ followingId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['following', user?.id] })
      await queryClient.cancelQueries({
        queryKey: ['isFollowing', user?.id, followingId],
      })

      // Snapshot previous values
      const previousFollowing = queryClient.getQueryData([
        'following',
        user?.id,
      ])
      const previousIsFollowing = queryClient.getQueryData([
        'isFollowing',
        user?.id,
        followingId,
      ])

      // Optimistically set isFollowing to true
      queryClient.setQueryData(['isFollowing', user?.id, followingId], true)

      return { previousFollowing, previousIsFollowing, followingId }
    },
    onError: (_err, { followingId }, context) => {
      // Rollback to previous values on error
      if (context?.previousFollowing !== undefined) {
        queryClient.setQueryData(
          ['following', user?.id],
          context.previousFollowing
        )
      }
      if (context?.previousIsFollowing !== undefined) {
        queryClient.setQueryData(
          ['isFollowing', user?.id, followingId],
          context.previousIsFollowing
        )
      }
    },
    onSettled: (_data, _error, { followingId }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['followers', followingId] })
      queryClient.invalidateQueries({
        queryKey: ['isFollowing', user?.id, followingId],
      })
      queryClient.invalidateQueries({ queryKey: ['profile', followingId] })
    },
  })
}

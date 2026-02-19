// src/features/groups/hooks/useLeaveGroup.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { leaveGroup } from '../services/membership.service'

/**
 * Hook to leave a group with optimistic update
 */
export function useLeaveGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) =>
      leaveGroup(groupId, user!.id),
    onMutate: async ({ groupId }) => {
      await queryClient.cancelQueries({
        queryKey: ['groupMembership', groupId, user?.id],
      })
      const previousMembership = queryClient.getQueryData([
        'groupMembership',
        groupId,
        user?.id,
      ])
      queryClient.setQueryData(['groupMembership', groupId, user?.id], {
        isMember: false,
        role: null,
        hasPendingRequest: false,
      })
      return { previousMembership, groupId }
    },
    onError: (_err, { groupId }, context) => {
      if (context?.previousMembership) {
        queryClient.setQueryData(
          ['groupMembership', groupId, user?.id],
          context.previousMembership
        )
      }
    },
    onSettled: (_data, _error, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
      queryClient.invalidateQueries({
        queryKey: ['groupMembership', groupId, user?.id],
      })
    },
  })
}

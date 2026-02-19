// src/features/groups/hooks/useInviteToGroup.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { inviteToGroup } from '../services/membership.service'

/**
 * Hook to invite a user to a group (admin action)
 */
export function useInviteToGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      groupId,
      invitedUserId,
    }: {
      groupId: string
      invitedUserId: string
    }) => inviteToGroup(groupId, invitedUserId, user!.id),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: ['groupInvites', groupId],
      })
    },
  })
}

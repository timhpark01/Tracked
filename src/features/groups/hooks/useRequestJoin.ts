// src/features/groups/hooks/useRequestJoin.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { requestToJoin } from '../services/membership.service'

/**
 * Hook to request to join a group
 */
export function useRequestJoin() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      groupId,
      message,
    }: {
      groupId: string
      message?: string
    }) => requestToJoin(groupId, user!.id, message),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: ['groupMembership', groupId, user?.id],
      })
    },
  })
}

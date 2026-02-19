// src/features/groups/hooks/useRespondToRequest.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { respondToRequest } from '../services/membership.service'

/**
 * Hook to respond to a join request (admin action)
 */
export function useRespondToRequest() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requestId,
      status,
      groupId,
    }: {
      requestId: string
      status: 'approved' | 'rejected'
      groupId: string
    }) => respondToRequest(requestId, status, user!.id),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: ['groupPendingRequests', groupId],
      })
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}

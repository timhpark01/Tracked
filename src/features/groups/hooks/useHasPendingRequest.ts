// src/features/groups/hooks/useHasPendingRequest.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { checkPendingRequest } from '../services/membership.service'

/**
 * Hook to check if user has a pending join request for a group
 * Only enabled for request-type groups where user is not a member
 */
export function useHasPendingRequest(groupId: string, enabled: boolean) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['pendingRequest', groupId, user?.id],
    queryFn: async () => {
      const request = await checkPendingRequest(groupId, user!.id)
      return !!request
    },
    enabled: !!user && !!groupId && enabled,
    staleTime: 5 * 60 * 1000,
  })
}

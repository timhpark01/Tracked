// src/features/groups/hooks/usePendingRequests.ts
import { useQuery } from '@tanstack/react-query'
import { getPendingRequests } from '../services/membership.service'

/**
 * Hook to fetch pending join requests for a group (admin view)
 */
export function usePendingRequests(groupId: string) {
  return useQuery({
    queryKey: ['groupPendingRequests', groupId],
    queryFn: () => getPendingRequests(groupId),
    enabled: !!groupId,
    staleTime: 60 * 1000, // 1 minute
  })
}

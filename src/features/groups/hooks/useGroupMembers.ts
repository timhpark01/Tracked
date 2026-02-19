// src/features/groups/hooks/useGroupMembers.ts
import { useQuery } from '@tanstack/react-query'
import { getGroupMembers } from '../services/membership.service'

/**
 * Hook to fetch all members of a group
 */
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => getGroupMembers(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

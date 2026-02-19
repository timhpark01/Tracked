// src/features/groups/hooks/useGroup.ts
import { useQuery } from '@tanstack/react-query'
import { getGroup } from '../services/groups.service'

/**
 * Hook to fetch a single group by ID
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroup(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

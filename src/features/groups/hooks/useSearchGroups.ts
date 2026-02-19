// src/features/groups/hooks/useSearchGroups.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { searchGroups } from '../services/groups.service'

/**
 * Hook to search for groups by name prefix
 */
export function useSearchGroups(query: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['searchGroups', query],
    queryFn: () => searchGroups(query),
    enabled: !!user && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

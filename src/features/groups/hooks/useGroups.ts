// src/features/groups/hooks/useGroups.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getUserGroups } from '../services/groups.service'

/**
 * Hook to fetch the current user's groups
 */
export function useGroups() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['groups', user?.id],
    queryFn: () => getUserGroups(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

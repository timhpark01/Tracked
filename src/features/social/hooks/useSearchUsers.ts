// src/features/social/hooks/useSearchUsers.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { searchUsers } from '../services/social.service'

/**
 * Hook to search for users by username prefix
 * @param query - The search query (min 2 characters)
 */
export function useSearchUsers(query: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => searchUsers(query, user!.id),
    enabled: !!user && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds - search results can change
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// src/features/social/hooks/useFollowers.ts
import { useQuery } from '@tanstack/react-query'
import { getFollowers } from '../services/social.service'

/**
 * Hook to fetch a user's followers
 * @param userId - The user ID to fetch followers for
 */
export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => getFollowers(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

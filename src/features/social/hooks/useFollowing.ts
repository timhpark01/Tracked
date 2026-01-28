// src/features/social/hooks/useFollowing.ts
import { useQuery } from '@tanstack/react-query'
import { getFollowing } from '../services/social.service'

/**
 * Hook to fetch users that a user is following
 * @param userId - The user ID to fetch following list for
 */
export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => getFollowing(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

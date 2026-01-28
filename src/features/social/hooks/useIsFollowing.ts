// src/features/social/hooks/useIsFollowing.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { checkIsFollowing } from '../services/social.service'

/**
 * Hook to check if the current user is following a target user
 * @param targetUserId - The user ID to check follow status for
 */
export function useIsFollowing(targetUserId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['isFollowing', user?.id, targetUserId],
    queryFn: () => checkIsFollowing(user!.id, targetUserId),
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

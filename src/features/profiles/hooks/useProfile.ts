// src/features/profiles/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../services/profiles.service'

/**
 * Hook to fetch any user's profile by ID
 * Used for viewing other users' profiles (PROF-04)
 * @param userId - The user ID to fetch profile for
 */
export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

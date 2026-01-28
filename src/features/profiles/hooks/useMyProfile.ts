// src/features/profiles/hooks/useMyProfile.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getProfile } from '../services/profiles.service'

/**
 * Hook to fetch the current user's profile
 * Automatically gets user ID from auth context
 */
export function useMyProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

// src/features/profiles/hooks/useMyProfile.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { supabase } from '@/lib/supabase'
import { getProfile } from '../services/profiles.service'

/**
 * Hook to fetch the current user's profile
 * Automatically gets user ID from auth context
 */
export function useMyProfile() {
  const { user, loading: authLoading } = useAuth()

  return useQuery({
    queryKey: ['my-profile', user?.id ?? 'none'],
    queryFn: async () => {
      // Get user directly from Supabase to ensure we have latest auth state
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return null
      return getProfile(currentUser.id)
    },
    // Wait for auth to finish loading
    enabled: !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

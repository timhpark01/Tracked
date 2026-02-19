// src/features/activities/hooks/useActivities.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { supabase } from '@/lib/supabase'
import { getActivities } from '../services/activities.service'

/**
 * Hook for fetching activities
 * @param targetUserId - Optional user ID for fetching another user's activities
 */
export function useActivities(targetUserId?: string) {
  const { user, loading: authLoading } = useAuth()
  const userId = targetUserId || user?.id

  return useQuery({
    queryKey: ['activities', userId ?? 'none'],
    queryFn: async () => {
      if (targetUserId) {
        // Fetching another user's activities
        return getActivities(targetUserId)
      }
      // Get user directly from Supabase to ensure we have latest auth state
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return []
      return getActivities(currentUser.id)
    },
    // Wait for auth to finish loading, or if we have a target user ID
    enabled: !!targetUserId || !authLoading,
  })
}

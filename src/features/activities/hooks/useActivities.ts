// src/features/activities/hooks/useActivities.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { supabase } from '@/lib/supabase'
import { getActivities } from '../services/activities.service'

export function useActivities() {
  const { user, loading: authLoading } = useAuth()

  return useQuery({
    queryKey: ['activities', user?.id ?? 'none'],
    queryFn: async () => {
      // Get user directly from Supabase to ensure we have latest auth state
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return []
      return getActivities(currentUser.id)
    },
    // Wait for auth to finish loading
    enabled: !authLoading,
  })
}

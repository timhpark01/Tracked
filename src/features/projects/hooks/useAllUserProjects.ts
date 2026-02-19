// src/features/projects/hooks/useAllUserProjects.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getAllUserProjects } from '../services/projects.service'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

/**
 * Hook for fetching all projects for a user
 * @param targetUserId - Optional user ID for fetching another user's projects
 */
export function useAllUserProjects(targetUserId?: string) {
  const { user, loading: authLoading } = useAuth()
  const userId = targetUserId || user?.id

  return useQuery<Project[]>({
    queryKey: ['all-projects', userId ?? 'none'],
    queryFn: async () => {
      if (!userId) return []
      return getAllUserProjects(userId)
    },
    enabled: !!targetUserId || (!authLoading && !!user),
  })
}

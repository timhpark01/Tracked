// src/features/projects/hooks/useRecentProjects.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getRecentProjects } from '../services/projects.service'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

export function useRecentProjects(limit: number = 5) {
  const { user, loading: authLoading } = useAuth()

  return useQuery<Project[]>({
    queryKey: ['recent-projects', user?.id ?? 'none', limit],
    queryFn: async () => {
      if (!user) return []
      return getRecentProjects(user.id, limit)
    },
    enabled: !authLoading && !!user,
  })
}

// src/features/projects/hooks/useAllUserProjects.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getAllUserProjects } from '../services/projects.service'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

export function useAllUserProjects() {
  const { user, loading: authLoading } = useAuth()

  return useQuery<Project[]>({
    queryKey: ['all-projects', user?.id ?? 'none'],
    queryFn: async () => {
      if (!user) return []
      return getAllUserProjects(user.id)
    },
    enabled: !authLoading && !!user,
  })
}

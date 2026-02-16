// src/features/projects/hooks/useProjects.ts
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '../services/projects.service'

export function useProjects(activityId: string) {
  return useQuery({
    queryKey: ['projects', activityId],
    queryFn: () => getProjects(activityId),
    enabled: !!activityId,
  })
}

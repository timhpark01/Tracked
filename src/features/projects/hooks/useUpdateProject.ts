// src/features/projects/hooks/useUpdateProject.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProject } from '../services/projects.service'
import type { Database } from '@/types/database'

type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: ProjectUpdate }) =>
      updateProject(projectId, updates),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['project', updatedProject.id] })
      queryClient.invalidateQueries({ queryKey: ['projects', updatedProject.activity_id] })
      queryClient.invalidateQueries({ queryKey: ['all-projects', updatedProject.user_id] })
    },
  })
}

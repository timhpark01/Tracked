// src/features/projects/hooks/useCreateProject.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '../services/projects.service'

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      // Invalidate relevant queries - use user_id from the created project to avoid race conditions
      queryClient.invalidateQueries({ queryKey: ['projects', newProject.activity_id] })
      queryClient.invalidateQueries({ queryKey: ['all-projects', newProject.user_id] })
    },
  })
}

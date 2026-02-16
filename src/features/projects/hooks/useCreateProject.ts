// src/features/projects/hooks/useCreateProject.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '../services/projects.service'
import { useAuth } from '@/features/auth'

export function useCreateProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['projects', newProject.activity_id] })
      queryClient.invalidateQueries({ queryKey: ['all-projects', user?.id] })
    },
  })
}

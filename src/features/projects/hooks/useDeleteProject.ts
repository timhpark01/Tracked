// src/features/projects/hooks/useDeleteProject.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProject } from '../services/projects.service'
import { useAuth } from '@/features/auth'

export function useDeleteProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, activityId }: { projectId: string; activityId: string }) =>
      deleteProject(projectId),
    onSuccess: (_, { activityId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', activityId] })
      queryClient.invalidateQueries({ queryKey: ['all-projects', user?.id] })
    },
  })
}

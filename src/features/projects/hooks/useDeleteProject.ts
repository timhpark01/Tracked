// src/features/projects/hooks/useDeleteProject.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProject } from '../services/projects.service'

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, activityId, userId }: { projectId: string; activityId: string; userId: string }) =>
      deleteProject(projectId),
    onSuccess: (_, { activityId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', activityId] })
      queryClient.invalidateQueries({ queryKey: ['all-projects', userId] })
    },
  })
}

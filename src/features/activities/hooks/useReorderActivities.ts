// src/features/activities/hooks/useReorderActivities.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { reorderActivities } from '../services/activities.service'

export function useReorderActivities() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activityIds: string[]) => reorderActivities(activityIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', user?.id] })
    },
  })
}

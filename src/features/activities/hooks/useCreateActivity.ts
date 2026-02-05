// src/features/activities/hooks/useCreateActivity.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createActivity } from '../services/activities.service'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']

export function useCreateActivity() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createActivity,
    onMutate: async (newActivity: ActivityInsert) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['activities', user?.id] })

      // Snapshot the previous value
      const previousActivities = queryClient.getQueryData<Activity[]>(['activities', user?.id])

      // Optimistically update to the new value
      const optimisticActivity: Activity = {
        id: `temp-${Date.now()}`,
        user_id: newActivity.user_id,
        name: newActivity.name,
        description: newActivity.description ?? null,
        category: newActivity.category ?? null,
        goal_total: newActivity.goal_total ?? null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Activity[]>(
        ['activities', user?.id],
        (old = []) => [optimisticActivity, ...old]
      )

      // Return context with snapshot
      return { previousActivities }
    },
    onError: (_err, _newActivity, context) => {
      // Rollback to previous value on error
      if (context?.previousActivities) {
        queryClient.setQueryData(['activities', user?.id], context.previousActivities)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['activities', user?.id] })
    },
  })
}

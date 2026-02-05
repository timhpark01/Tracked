// src/features/activities/hooks/useDeleteActivity.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteActivity } from '../services/activities.service'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']

export function useDeleteActivity() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteActivity,
    onMutate: async (activityId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['activities', user?.id] })
      await queryClient.cancelQueries({ queryKey: ['activity', activityId] })

      // Snapshot previous values
      const previousActivities = queryClient.getQueryData<Activity[]>(['activities', user?.id])
      const previousActivity = queryClient.getQueryData<Activity>(['activity', activityId])

      // Optimistically remove from activities list
      queryClient.setQueryData<Activity[]>(
        ['activities', user?.id],
        (old = []) => old.filter((activity) => activity.id !== activityId)
      )

      // Remove from single activity cache
      queryClient.removeQueries({ queryKey: ['activity', activityId] })

      return { previousActivities, previousActivity, activityId }
    },
    onError: (_err, activityId, context) => {
      // Rollback to previous values on error
      if (context?.previousActivities) {
        queryClient.setQueryData(['activities', user?.id], context.previousActivities)
      }
      if (context?.previousActivity) {
        queryClient.setQueryData(['activity', activityId], context.previousActivity)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['activities', user?.id] })
    },
  })
}

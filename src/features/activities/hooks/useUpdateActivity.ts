// src/features/activities/hooks/useUpdateActivity.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateActivity } from '../services/activities.service'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

interface UpdateActivityInput {
  activityId: string
  updates: ActivityUpdate
}

export function useUpdateActivity() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, updates }: UpdateActivityInput) =>
      updateActivity(activityId, updates),
    onMutate: async ({ activityId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['activities', user?.id] })
      await queryClient.cancelQueries({ queryKey: ['activity', activityId] })

      // Snapshot previous values
      const previousActivities = queryClient.getQueryData<Activity[]>(['activities', user?.id])
      const previousActivity = queryClient.getQueryData<Activity>(['activity', activityId])

      // Optimistically update activities list
      queryClient.setQueryData<Activity[]>(
        ['activities', user?.id],
        (old = []) =>
          old.map((activity) =>
            activity.id === activityId ? { ...activity, ...updates } : activity
          )
      )

      // Optimistically update single activity
      if (previousActivity) {
        queryClient.setQueryData<Activity>(['activity', activityId], {
          ...previousActivity,
          ...updates,
        })
      }

      return { previousActivities, previousActivity }
    },
    onError: (_err, { activityId }, context) => {
      // Rollback to previous values on error
      if (context?.previousActivities) {
        queryClient.setQueryData(['activities', user?.id], context.previousActivities)
      }
      if (context?.previousActivity) {
        queryClient.setQueryData(['activity', activityId], context.previousActivity)
      }
    },
    onSettled: (_data, _err, { activityId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['activities', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] })
    },
  })
}

// src/features/logs/hooks/useCreateLog.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createLog } from '../services/logs.service'
import { uploadLogMediaItems, type MediaItem } from '@/lib/storage'
import { useAuth } from '@/features/auth'

interface CreateLogInput {
  projectId: string
  activityId: string
  value: number
  note?: string
  mediaItems?: MediaItem[]
  loggedAt?: string
}

export function useCreateLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateLogInput) => {
      if (!user) {
        throw new Error('User must be authenticated to create a log')
      }

      let image_urls: string[] | undefined

      // Upload media items if provided
      if (input.mediaItems && input.mediaItems.length > 0) {
        const tempId = `${Date.now()}`
        image_urls = await uploadLogMediaItems(user.id, tempId, input.mediaItems)
      }

      return createLog({
        project_id: input.projectId,
        activity_id: input.activityId,
        user_id: user.id,
        value: input.value,
        note: input.note,
        image_urls,
        logged_at: input.loggedAt,
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logs', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.activityId] })
      queryClient.invalidateQueries({ queryKey: ['activity-logs', variables.activityId] })
      queryClient.invalidateQueries({ queryKey: ['recent-projects', user?.id] })
      // Invalidate feed so followers see the new log
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

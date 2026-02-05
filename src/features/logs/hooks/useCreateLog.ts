// src/features/logs/hooks/useCreateLog.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createLog } from '../services/logs.service'
import { uploadLogPhoto } from '@/lib/storage'
import { useAuth } from '@/features/auth'

interface CreateLogInput {
  activityId: string
  value: number
  note?: string
  photoUri?: string
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

      // Upload photo if provided
      if (input.photoUri) {
        const tempId = `${Date.now()}`
        const url = await uploadLogPhoto(user.id, tempId, input.photoUri)
        image_urls = [url]
      }

      return createLog({
        activity_id: input.activityId,
        user_id: user.id,
        value: input.value,
        note: input.note,
        image_urls,
        logged_at: input.loggedAt,
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logs', variables.activityId] })
      queryClient.invalidateQueries({ queryKey: ['activity-stats', variables.activityId] })
      // Invalidate feed so followers see the new log
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

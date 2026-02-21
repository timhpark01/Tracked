// src/features/logs/hooks/useUpdateLog.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateLog } from '../services/logs.service'
import { uploadLogPhoto } from '@/lib/storage'
import { useAuth } from '@/features/auth'

interface UpdateLogInput {
  logId: string
  projectId: string
  activityId: string
  value?: number
  note?: string | null
  photoUri?: string
  existingImageUrls?: string[] | null
  loggedAt?: string
}

export function useUpdateLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateLogInput) => {
      if (!user) {
        throw new Error('User must be authenticated to update a log')
      }

      let image_urls: string[] | undefined = input.existingImageUrls ?? undefined

      // Upload new photo if provided (local URI starts with file://)
      if (input.photoUri && input.photoUri.startsWith('file://')) {
        const tempId = `${Date.now()}`
        const url = await uploadLogPhoto(user.id, tempId, input.photoUri)
        image_urls = [url]
      } else if (input.photoUri) {
        // Keep existing remote URL
        image_urls = [input.photoUri]
      }

      return updateLog(input.logId, {
        value: input.value,
        note: input.note,
        image_urls,
        logged_at: input.loggedAt,
      })
    },
    onSuccess: (_data, variables) => {
      // Invalidate both log query variants (feed version and raw version)
      queryClient.invalidateQueries({ queryKey: ['log', variables.logId] })
      queryClient.invalidateQueries({ queryKey: ['log-raw', variables.logId] })
      queryClient.invalidateQueries({ queryKey: ['logs', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['activity-logs', variables.activityId] })
      // Invalidate feed in case the log appears there
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

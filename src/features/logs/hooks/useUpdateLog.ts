// src/features/logs/hooks/useUpdateLog.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateLog } from '../services/logs.service'
import { uploadLogPhoto } from '@/lib/storage'
import { useAuth } from '@/features/auth'
import type { LogFieldValues } from '@/types/fields'
import type { Database } from '@/types/database'

interface UpdateLogInput {
  logId: string
  projectId: string
  activityId: string
  value?: number
  note?: string | null
  photoUri?: string
  existingImageUrls?: string[] | null
  loggedAt?: string
  existingMetadata?: unknown // Pass existing metadata so we can update it
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

      // Update metadata fields with the new value
      let metadata: Database['public']['Tables']['activity_logs']['Update']['metadata'] = undefined
      if (input.value !== undefined && input.existingMetadata) {
        const existingMeta = input.existingMetadata as LogFieldValues
        if (existingMeta?.fields && typeof existingMeta.fields === 'object') {
          const fieldNames = Object.keys(existingMeta.fields)
          if (fieldNames.length > 0) {
            // Update the first (primary) field with the new value
            const primaryFieldName = fieldNames[0]
            const updatedFields = {
              ...existingMeta.fields,
              [primaryFieldName]: {
                ...existingMeta.fields[primaryFieldName],
                value: input.value,
              },
            }
            metadata = { fields: updatedFields } as Database['public']['Tables']['activity_logs']['Update']['metadata']
          }
        }
      }

      return updateLog(input.logId, {
        value: input.value,
        note: input.note,
        image_urls,
        logged_at: input.loggedAt,
        metadata,
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

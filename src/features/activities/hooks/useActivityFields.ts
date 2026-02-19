// src/features/activities/hooks/useActivityFields.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getActivityFields,
  createActivityField,
  updateActivityField,
  deleteActivityField,
  replaceActivityFields,
} from '../services/fields.service'
import type { ActivityFieldInsert, ActivityFieldUpdate } from '@/types/fields'

export function useActivityFields(activityId: string) {
  return useQuery({
    queryKey: ['activity-fields', activityId],
    queryFn: () => getActivityFields(activityId),
    enabled: !!activityId,
  })
}

export function useCreateActivityField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createActivityField,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity-fields', data.activity_id] })
    },
  })
}

export function useUpdateActivityField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fieldId, updates }: { fieldId: string; updates: ActivityFieldUpdate }) =>
      updateActivityField(fieldId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity-fields', data.activity_id] })
    },
  })
}

export function useDeleteActivityField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteActivityField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-fields'] })
    },
  })
}

export function useReplaceActivityFields() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      activityId,
      fields,
    }: {
      activityId: string
      fields: Omit<ActivityFieldInsert, 'activity_id'>[]
    }) => replaceActivityFields(activityId, fields),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activity-fields', variables.activityId] })
    },
  })
}

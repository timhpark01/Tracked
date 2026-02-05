// src/features/logs/hooks/useDeleteLog.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteLog } from '../services/logs.service'

interface DeleteLogInput {
  logId: string
  activityId: string
}

export function useDeleteLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteLogInput) => {
      await deleteLog(input.logId)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logs', variables.activityId] })
      queryClient.invalidateQueries({ queryKey: ['activity-stats', variables.activityId] })
    },
  })
}

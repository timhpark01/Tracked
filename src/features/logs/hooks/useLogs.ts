// src/features/logs/hooks/useLogs.ts
import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../services/logs.service'

export function useLogs(activityId: string) {
  return useQuery({
    queryKey: ['logs', activityId],
    queryFn: () => getLogs(activityId),
    enabled: !!activityId,
  })
}

// src/features/logs/hooks/useLog.ts
import { useQuery } from '@tanstack/react-query'
import { getLog } from '../services/logs.service'

export function useLog(logId: string) {
  return useQuery({
    queryKey: ['log', logId],
    queryFn: () => getLog(logId),
    enabled: !!logId,
  })
}

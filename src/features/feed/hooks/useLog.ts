// src/features/feed/hooks/useLog.ts
import { useQuery } from '@tanstack/react-query'
import { getLogById } from '../services/getLog'

/**
 * Fetch a single activity log by ID
 */
export function useLog(logId: string) {
  return useQuery({
    queryKey: ['log', logId],
    queryFn: () => getLogById(logId),
    enabled: !!logId,
  })
}

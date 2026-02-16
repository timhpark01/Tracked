// src/features/logs/hooks/useLogs.ts
import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../services/logs.service'

export function useLogs(projectId: string) {
  return useQuery({
    queryKey: ['logs', projectId],
    queryFn: () => getLogs(projectId),
    enabled: !!projectId,
  })
}

// src/features/logs/hooks/useLogs.ts
import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../services/logs.service'

export function useLogs(hobbyId: string) {
  return useQuery({
    queryKey: ['logs', hobbyId],
    queryFn: () => getLogs(hobbyId),
    enabled: !!hobbyId,
  })
}

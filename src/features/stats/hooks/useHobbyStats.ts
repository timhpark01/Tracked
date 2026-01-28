// src/features/stats/hooks/useHobbyStats.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface HobbyStats {
  totalValue: number
  logCount: number
  goalTotal: number | null
  progressPercent: number
  goalUnit: string | null
}

async function getHobbyStats(hobbyId: string): Promise<HobbyStats> {
  // Get hobby for goal info
  const { data: hobby, error: hobbyError } = await supabase
    .from('hobbies')
    .select('goal_total, goal_unit, tracking_type')
    .eq('id', hobbyId)
    .single()

  if (hobbyError) throw hobbyError

  // Get logs with count
  const { data: logs, count, error: logsError } = await supabase
    .from('hobby_logs')
    .select('value', { count: 'exact' })
    .eq('hobby_id', hobbyId)

  if (logsError) throw logsError

  const totalValue = logs?.reduce((sum, log) => sum + log.value, 0) ?? 0
  const goalTotal = hobby?.goal_total ?? null
  const progressPercent = goalTotal
    ? Math.min(100, Math.round((totalValue / goalTotal) * 100))
    : 0

  return {
    totalValue,
    logCount: count ?? 0,
    goalTotal,
    progressPercent,
    goalUnit: hobby?.goal_unit ?? (hobby?.tracking_type === 'time' ? 'minutes' : null),
  }
}

export function useHobbyStats(hobbyId: string) {
  return useQuery({
    queryKey: ['hobby-stats', hobbyId],
    queryFn: () => getHobbyStats(hobbyId),
    enabled: !!hobbyId,
  })
}

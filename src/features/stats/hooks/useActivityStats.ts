// src/features/stats/hooks/useActivityStats.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ActivityStats {
  totalValue: number
  logCount: number
  goalTotal: number | null
  progressPercent: number
}

async function getActivityStats(activityId: string): Promise<ActivityStats> {
  // Get activity for goal info
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('goal_total')
    .eq('id', activityId)
    .single()

  if (activityError) throw activityError

  // Get logs with count
  const { data: logs, count, error: logsError } = await supabase
    .from('activity_logs')
    .select('value', { count: 'exact' })
    .eq('activity_id', activityId)

  if (logsError) throw logsError

  // totalValue is in minutes, goalTotal is in hours
  const totalMinutes = logs?.reduce((sum, log) => sum + log.value, 0) ?? 0
  const goalTotalHours = activity?.goal_total ?? null
  const goalTotalMinutes = goalTotalHours ? goalTotalHours * 60 : null
  const progressPercent = goalTotalMinutes
    ? Math.min(100, Math.round((totalMinutes / goalTotalMinutes) * 100))
    : 0

  return {
    totalValue: totalMinutes,
    logCount: count ?? 0,
    goalTotal: goalTotalHours,
    progressPercent,
  }
}

export function useActivityStats(activityId: string) {
  return useQuery({
    queryKey: ['activity-stats', activityId],
    queryFn: () => getActivityStats(activityId),
    enabled: !!activityId,
  })
}

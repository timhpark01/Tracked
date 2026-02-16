// src/features/logs/services/logs.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']

export async function getLogs(projectId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('logged_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getLogsByActivity(activityId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, projects!inner(activity_id)')
    .eq('projects.activity_id', activityId)
    .order('logged_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createLog(log: ActivityLogInsert): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(log)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('id', logId)

  if (error) throw error
}

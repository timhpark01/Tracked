// src/features/logs/services/logs.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { FieldValue, LogFieldValues } from '@/types/fields'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']
type ActivityLogUpdate = Database['public']['Tables']['activity_logs']['Update']

export type { ActivityLog, ActivityLogInsert, ActivityLogUpdate }

export interface CreateLogWithFieldsInput {
  project_id: string
  activity_id: string
  user_id: string
  note?: string | null
  image_urls?: string[]
  logged_at?: string
  fieldValues: Record<string, FieldValue>
}

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

export async function getLog(logId: string): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('id', logId)
    .single()

  if (error) throw error
  return data
}

export async function updateLog(logId: string, updates: ActivityLogUpdate): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createLogWithFields(input: CreateLogWithFieldsInput): Promise<ActivityLog> {
  // Find the primary field value for backwards compatibility with the value column
  const fieldEntries = Object.entries(input.fieldValues)
  const primaryFieldValue = fieldEntries.length > 0 ? fieldEntries[0][1].value : 0
  const numericValue = typeof primaryFieldValue === 'number' ? primaryFieldValue : 0

  const metadata = { fields: input.fieldValues } as unknown as Database['public']['Tables']['activity_logs']['Insert']['metadata']

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      project_id: input.project_id,
      activity_id: input.activity_id,
      user_id: input.user_id,
      value: numericValue,
      note: input.note,
      image_urls: input.image_urls,
      logged_at: input.logged_at,
      metadata,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLogWithFields(
  logId: string,
  fieldValues: Record<string, FieldValue>,
  updates?: Partial<Pick<ActivityLogUpdate, 'note' | 'image_urls' | 'logged_at'>>
): Promise<ActivityLog> {
  const fieldEntries = Object.entries(fieldValues)
  const primaryFieldValue = fieldEntries.length > 0 ? fieldEntries[0][1].value : 0
  const numericValue = typeof primaryFieldValue === 'number' ? primaryFieldValue : 0

  const metadata = { fields: fieldValues } as unknown as Database['public']['Tables']['activity_logs']['Update']['metadata']

  const { data, error } = await supabase
    .from('activity_logs')
    .update({
      ...updates,
      value: numericValue,
      metadata,
    })
    .eq('id', logId)
    .select()
    .single()

  if (error) throw error
  return data
}

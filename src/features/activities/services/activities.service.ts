// src/features/activities/services/activities.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

export type { Activity, ActivityInsert, ActivityUpdate }

export async function getActivities(userId: string): Promise<Activity[]> {
  // Try ordering by display_order first, fallback to created_at if column doesn't exist yet
  let result = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })

  // If display_order column doesn't exist yet, fallback to created_at
  if (result.error?.message?.includes('display_order')) {
    result = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  }

  if (result.error) throw result.error
  return result.data
}

export async function getActivity(activityId: string): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single()

  if (error) throw error
  return data
}

export async function createActivity(activity: ActivityInsert): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateActivity(activityId: string, updates: ActivityUpdate): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', activityId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) throw error
}

export async function reorderActivities(
  activityIds: string[]
): Promise<void> {
  // Update each activity with its new display_order
  const updates = activityIds.map((id, index) => ({
    id,
    display_order: index + 1,
  }))

  // Use a transaction-like approach with Promise.all
  const results = await Promise.all(
    updates.map(({ id, display_order }) =>
      supabase
        .from('activities')
        .update({ display_order })
        .eq('id', id)
    )
  )

  // Check for any errors
  const error = results.find((r) => r.error)?.error
  if (error) throw error
}

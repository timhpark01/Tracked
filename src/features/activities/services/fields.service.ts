// src/features/activities/services/fields.service.ts
import { supabase } from '@/lib/supabase'
import type {
  ActivityField,
  ActivityFieldInsert,
  ActivityFieldUpdate,
} from '@/types/fields'

export type { ActivityField, ActivityFieldInsert, ActivityFieldUpdate }

export async function getActivityFields(activityId: string): Promise<ActivityField[]> {
  const { data, error } = await supabase
    .from('activity_fields')
    .select('*')
    .eq('activity_id', activityId)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createActivityField(field: ActivityFieldInsert): Promise<ActivityField> {
  const { data, error } = await supabase
    .from('activity_fields')
    .insert(field)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createActivityFields(
  fields: ActivityFieldInsert[]
): Promise<ActivityField[]> {
  if (fields.length === 0) return []

  const { data, error } = await supabase
    .from('activity_fields')
    .insert(fields)
    .select()

  if (error) throw error
  return data
}

export async function updateActivityField(
  fieldId: string,
  updates: ActivityFieldUpdate
): Promise<ActivityField> {
  const { data, error } = await supabase
    .from('activity_fields')
    .update(updates)
    .eq('id', fieldId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteActivityField(fieldId: string): Promise<void> {
  const { error } = await supabase
    .from('activity_fields')
    .delete()
    .eq('id', fieldId)

  if (error) throw error
}

export async function deleteActivityFields(activityId: string): Promise<void> {
  const { error } = await supabase
    .from('activity_fields')
    .delete()
    .eq('activity_id', activityId)

  if (error) throw error
}

export async function replaceActivityFields(
  activityId: string,
  fields: Omit<ActivityFieldInsert, 'activity_id'>[]
): Promise<ActivityField[]> {
  // Delete existing fields
  await deleteActivityFields(activityId)

  // Insert new fields with proper order
  const fieldsToInsert = fields.map((field, index) => ({
    ...field,
    activity_id: activityId,
    display_order: index,
  }))

  return createActivityFields(fieldsToInsert)
}

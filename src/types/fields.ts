// src/types/fields.ts
import type { Database } from './database'

export type FieldType = 'time' | 'number' | 'distance' | 'text'

export type ActivityField = Database['public']['Tables']['activity_fields']['Row']
export type ActivityFieldInsert = Database['public']['Tables']['activity_fields']['Insert']
export type ActivityFieldUpdate = Database['public']['Tables']['activity_fields']['Update']

export type ActivityTemplate = Database['public']['Tables']['activity_templates']['Row']
export type ActivityTemplateInsert = Database['public']['Tables']['activity_templates']['Insert']
export type ActivityTemplateUpdate = Database['public']['Tables']['activity_templates']['Update']

export type TemplateField = Database['public']['Tables']['template_fields']['Row']
export type TemplateFieldInsert = Database['public']['Tables']['template_fields']['Insert']
export type TemplateFieldUpdate = Database['public']['Tables']['template_fields']['Update']

export interface FieldValue {
  value: number | string | null
  unit: string
}

export interface LogFieldValues {
  fields: Record<string, FieldValue>
}

export interface TemplateWithFields extends ActivityTemplate {
  fields: TemplateField[]
}

export interface ActivityWithFields {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  fields: ActivityField[]
}

export function parseLogMetadata(metadata: unknown): LogFieldValues {
  if (
    typeof metadata === 'object' &&
    metadata !== null &&
    'fields' in metadata &&
    typeof (metadata as { fields: unknown }).fields === 'object'
  ) {
    return metadata as LogFieldValues
  }
  return { fields: {} }
}

export function buildLogMetadata(fieldValues: Record<string, FieldValue>): LogFieldValues {
  return { fields: fieldValues }
}

export function getFieldDisplayValue(field: ActivityField, value: FieldValue | undefined): string {
  if (!value || value.value === null || value.value === '') {
    return '-'
  }
  return `${value.value} ${value.unit}`
}

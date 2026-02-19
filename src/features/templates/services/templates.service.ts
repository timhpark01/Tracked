// src/features/templates/services/templates.service.ts
import { supabase } from '@/lib/supabase'
import type {
  ActivityTemplate,
  ActivityTemplateInsert,
  TemplateField,
  TemplateFieldInsert,
  TemplateWithFields,
} from '@/types/fields'

export type { ActivityTemplate, ActivityTemplateInsert, TemplateField, TemplateWithFields }

export async function getTemplates(userId?: string): Promise<TemplateWithFields[]> {
  let query = supabase
    .from('activity_templates')
    .select('*, template_fields(*)')
    .order('name', { ascending: true })

  if (userId) {
    query = query.or(`is_system.eq.true,user_id.eq.${userId}`)
  } else {
    query = query.eq('is_system', true)
  }

  const { data, error } = await query

  if (error) throw error

  return data.map((template) => ({
    ...template,
    fields: (template.template_fields ?? []).sort(
      (a: TemplateField, b: TemplateField) => a.display_order - b.display_order
    ),
  }))
}

export async function getSystemTemplates(): Promise<TemplateWithFields[]> {
  const { data, error } = await supabase
    .from('activity_templates')
    .select('*, template_fields(*)')
    .eq('is_system', true)
    .order('name', { ascending: true })

  if (error) throw error

  return data.map((template) => ({
    ...template,
    fields: (template.template_fields ?? []).sort(
      (a: TemplateField, b: TemplateField) => a.display_order - b.display_order
    ),
  }))
}

export async function getUserTemplates(userId: string): Promise<TemplateWithFields[]> {
  const { data, error } = await supabase
    .from('activity_templates')
    .select('*, template_fields(*)')
    .eq('user_id', userId)
    .eq('is_system', false)
    .order('name', { ascending: true })

  if (error) throw error

  return data.map((template) => ({
    ...template,
    fields: (template.template_fields ?? []).sort(
      (a: TemplateField, b: TemplateField) => a.display_order - b.display_order
    ),
  }))
}

export async function getTemplate(templateId: string): Promise<TemplateWithFields> {
  const { data, error } = await supabase
    .from('activity_templates')
    .select('*, template_fields(*)')
    .eq('id', templateId)
    .single()

  if (error) throw error

  return {
    ...data,
    fields: (data.template_fields ?? []).sort(
      (a: TemplateField, b: TemplateField) => a.display_order - b.display_order
    ),
  }
}

export async function createTemplate(
  template: ActivityTemplateInsert,
  fields: Omit<TemplateFieldInsert, 'template_id'>[]
): Promise<TemplateWithFields> {
  const { data: newTemplate, error: templateError } = await supabase
    .from('activity_templates')
    .insert({ ...template, is_system: false })
    .select()
    .single()

  if (templateError) throw templateError

  if (fields.length === 0) {
    return { ...newTemplate, fields: [] }
  }

  const fieldsToInsert = fields.map((field, index) => ({
    ...field,
    template_id: newTemplate.id,
    display_order: index,
  }))

  const { data: newFields, error: fieldsError } = await supabase
    .from('template_fields')
    .insert(fieldsToInsert)
    .select()

  if (fieldsError) throw fieldsError

  return { ...newTemplate, fields: newFields }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('activity_templates')
    .delete()
    .eq('id', templateId)

  if (error) throw error
}

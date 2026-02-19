// src/features/templates/hooks/useTemplates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import {
  getTemplates,
  getSystemTemplates,
  getUserTemplates,
  getTemplate,
  createTemplate,
  deleteTemplate,
} from '../services/templates.service'
import type { ActivityTemplateInsert, TemplateFieldInsert } from '@/types/fields'

export function useTemplates() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['templates', user?.id ?? 'none'],
    queryFn: () => getTemplates(user?.id),
  })
}

export function useSystemTemplates() {
  return useQuery({
    queryKey: ['templates', 'system'],
    queryFn: getSystemTemplates,
  })
}

export function useUserTemplates() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['templates', 'user', user?.id ?? 'none'],
    queryFn: () => (user ? getUserTemplates(user.id) : Promise.resolve([])),
    enabled: !!user,
  })
}

export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplate(templateId),
    enabled: !!templateId,
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({
      template,
      fields,
    }: {
      template: Omit<ActivityTemplateInsert, 'user_id'>
      fields: Omit<TemplateFieldInsert, 'template_id'>[]
    }) => createTemplate({ ...template, user_id: user?.id ?? null }, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

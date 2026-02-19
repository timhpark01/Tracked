// src/features/activities/components/ActivityForm.tsx
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import { FieldEditor, type FieldDefinition } from './FieldEditor'
import type { Database } from '@/types/database'
import type { TemplateWithFields } from '@/types/fields'

type Activity = Database['public']['Tables']['activities']['Row']

const activitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

type ActivityFormData = z.infer<typeof activitySchema>

interface ActivityFormProps {
  initialData?: Partial<Activity>
  initialFields?: FieldDefinition[]
  template?: TemplateWithFields | null
  onSubmit: (data: {
    name: string
    description?: string | null
    fields: FieldDefinition[]
  }) => void
  isLoading?: boolean
}

export function ActivityForm({
  initialData,
  initialFields,
  template,
  onSubmit,
  isLoading = false,
}: ActivityFormProps) {
  const [fields, setFields] = useState<FieldDefinition[]>(() => {
    if (initialFields) return initialFields
    if (template) {
      return template.fields.map((f) => ({
        id: f.id,
        name: f.name,
        fieldType: f.field_type,
        unit: f.unit,
        isPrimary: f.is_primary,
      }))
    }
    // Default to a single Duration field
    return [
      {
        id: 'default-duration',
        name: 'Duration',
        fieldType: 'time' as const,
        unit: 'min',
        isPrimary: true,
      },
    ]
  })

  const {
    control,
    handleSubmit,
    setValue,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: template?.name ?? initialData?.name ?? '',
      description: template?.description ?? initialData?.description ?? '',
    },
  })

  // Update fields when initialFields loads (for edit mode)
  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      setFields(initialFields)
    }
  }, [initialFields])

  // Update form when template changes
  useEffect(() => {
    if (template) {
      setValue('name', template.name)
      setValue('description', template.description ?? '')
      setFields(
        template.fields.map((f) => ({
          id: f.id,
          name: f.name,
          fieldType: f.field_type,
          unit: f.unit,
          isPrimary: f.is_primary,
        }))
      )
    }
  }, [template, setValue])

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      name: data.name,
      description: data.description || null,
      fields,
    })
  })

  return (
    <View style={styles.container}>
      <ControlledInput
        control={control}
        name="name"
        label="Activity Name"
        placeholder="e.g., Running, Reading, Coding"
        style={styles.field}
      />

      <ControlledTextArea
        control={control}
        name="description"
        label="Description"
        placeholder="What is this activity about?"
        style={styles.field}
      />

      <FieldEditor fields={fields} onChange={setFields} />

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleFormSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {initialData ? 'Update Activity' : 'Create Activity'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

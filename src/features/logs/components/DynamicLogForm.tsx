// src/features/logs/components/DynamicLogForm.tsx
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { ControlledTextArea } from '@/components/forms'
import { FieldInput } from '@/components/FieldInput'
import { MediaPicker } from '@/components/MediaPicker'
import { type MediaItem } from '@/lib/storage'
import { useActivityFields } from '@/features/activities/hooks/useActivityFields'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { FieldValue } from '@/types/fields'

const logSchema = z.object({
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
})

type LogFormData = z.infer<typeof logSchema>

interface DynamicLogFormProps {
  activityId: string
  onSubmit: (data: {
    fieldValues: Record<string, FieldValue>
    note?: string
    mediaItems?: MediaItem[]
  }) => void
  isLoading?: boolean
  initialFieldValues?: Record<string, FieldValue>
  initialNote?: string
  initialMediaItems?: MediaItem[]
}

export function DynamicLogForm({
  activityId,
  onSubmit,
  isLoading = false,
  initialFieldValues,
  initialNote,
  initialMediaItems,
}: DynamicLogFormProps) {
  const { data: fields, isLoading: fieldsLoading } = useActivityFields(activityId)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    initialFieldValues
      ? Object.fromEntries(
          Object.entries(initialFieldValues).map(([key, val]) => [
            key,
            val.value?.toString() ?? '',
          ])
        )
      : {}
  )
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMediaItems ?? [])

  const { control, handleSubmit } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      note: initialNote ?? '',
    },
  })

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleFormSubmit = handleSubmit((data) => {
    // Convert string values to proper FieldValue objects
    const processedFieldValues: Record<string, FieldValue> = {}

    fields?.forEach((field) => {
      const rawValue = fieldValues[field.name]
      if (rawValue && rawValue.trim() !== '') {
        let parsedValue: number | string | null = rawValue

        // Parse numeric fields
        if (field.field_type !== 'text') {
          const numValue = parseFloat(rawValue)
          parsedValue = isNaN(numValue) ? null : numValue
        }

        if (parsedValue !== null) {
          processedFieldValues[field.name] = {
            value: parsedValue,
            unit: field.unit,
          }
        }
      }
    })

    onSubmit({
      fieldValues: processedFieldValues,
      note: data.note || undefined,
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
    })
  })

  if (fieldsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Dynamic field inputs */}
      {fields?.map((field) => (
        <View key={field.id} style={styles.field}>
          <FieldInput
            field={field}
            value={fieldValues[field.name] ?? ''}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
          {field.is_primary && (
            <Text style={styles.primaryBadge}>Primary</Text>
          )}
        </View>
      ))}

      {(!fields || fields.length === 0) && (
        <View style={styles.noFields}>
          <Text style={styles.noFieldsText}>
            No fields configured for this activity.
          </Text>
        </View>
      )}

      <ControlledTextArea
        control={control}
        name="note"
        label="Note (optional)"
        placeholder="How did it go? Any thoughts?"
        style={styles.field}
      />

      <View style={styles.field}>
        <MediaPicker items={mediaItems} onItemsChange={setMediaItems} />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleFormSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Log Progress</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  field: {
    marginBottom: 16,
  },
  primaryBadge: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  noFields: {
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 16,
  },
  noFieldsText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
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

// src/features/logs/components/DynamicLogForm.tsx
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useState } from 'react'
import { ControlledTextArea } from '@/components/forms'
import { FieldInput } from '@/components/FieldInput'
import { pickImage } from '@/lib/storage'
import { useActivityFields } from '@/features/activities/hooks/useActivityFields'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ActivityField, FieldValue } from '@/types/fields'

const logSchema = z.object({
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
})

type LogFormData = z.infer<typeof logSchema>

interface DynamicLogFormProps {
  activityId: string
  onSubmit: (data: {
    fieldValues: Record<string, FieldValue>
    note?: string
    photoUri?: string
  }) => void
  isLoading?: boolean
  initialFieldValues?: Record<string, FieldValue>
  initialNote?: string
  initialPhotoUri?: string
}

export function DynamicLogForm({
  activityId,
  onSubmit,
  isLoading = false,
  initialFieldValues,
  initialNote,
  initialPhotoUri,
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
  const [photoUri, setPhotoUri] = useState<string | null>(initialPhotoUri ?? null)

  const { control, handleSubmit } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      note: initialNote ?? '',
    },
  })

  const handlePickPhoto = async () => {
    const uri = await pickImage()
    if (uri) {
      setPhotoUri(uri)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoUri(null)
  }

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
      photoUri: photoUri || undefined,
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
        <Text style={styles.label}>Photo (optional)</Text>
        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
              <Text style={styles.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
            <Text style={styles.photoButtonText}>Add Photo</Text>
          </TouchableOpacity>
        )}
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  photoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  removePhotoText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  photoButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
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

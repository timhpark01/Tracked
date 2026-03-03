// src/features/logs/components/LogForm.tsx
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import { MediaPicker } from '@/components/MediaPicker'
import { type MediaItem } from '@/lib/storage'

const logSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
})

type LogFormData = z.infer<typeof logSchema>

interface LogFormProps {
  onSubmit: (data: { value: number; note?: string; mediaItems?: MediaItem[] }) => void
  isLoading?: boolean
}

export function LogForm({ onSubmit, isLoading = false }: LogFormProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])

  const { control, handleSubmit } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      value: '',
      note: '',
    },
  })

  const handleFormSubmit = handleSubmit((data) => {
    const parsedValue = parseFloat(data.value)
    if (isNaN(parsedValue) || parsedValue <= 0) {
      return
    }

    onSubmit({
      value: parsedValue,
      note: data.note || undefined,
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
    })
  })

  const valueLabel = 'Minutes'

  return (
    <View style={styles.container}>
      <ControlledInput
        control={control}
        name="value"
        label={valueLabel}
        placeholder={`Enter ${valueLabel.toLowerCase()}`}
        keyboardType="numeric"
        style={styles.field}
      />

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

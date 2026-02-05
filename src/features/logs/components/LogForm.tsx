// src/features/logs/components/LogForm.tsx
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import { pickImage } from '@/lib/storage'

const logSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
})

type LogFormData = z.infer<typeof logSchema>

interface LogFormProps {
  onSubmit: (data: { value: number; note?: string; photoUri?: string }) => void
  isLoading?: boolean
}

export function LogForm({ onSubmit, isLoading = false }: LogFormProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  const { control, handleSubmit } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      value: '',
      note: '',
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

  const handleFormSubmit = handleSubmit((data) => {
    const parsedValue = parseFloat(data.value)
    if (isNaN(parsedValue) || parsedValue <= 0) {
      return
    }

    onSubmit({
      value: parsedValue,
      note: data.note || undefined,
      photoUri: photoUri || undefined,
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
  field: {
    marginBottom: 16,
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

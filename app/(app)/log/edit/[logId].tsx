// app/(app)/log/edit/[logId].tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { ControlledTextArea } from '@/components/forms'
import { DurationPicker } from '@/components/DurationPicker'
import { pickImage } from '@/lib/storage'
import { useLog, useUpdateLog } from '@/features/logs'

const logSchema = z.object({
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
})

type LogFormData = z.infer<typeof logSchema>

export default function EditLogScreen() {
  const { logId } = useLocalSearchParams<{ logId: string }>()
  const { data: log, isLoading } = useLog(logId ?? '')
  const updateLog = useUpdateLog()

  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  const { control, handleSubmit, reset } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      note: '',
    },
  })

  // Initialize form with log data
  useEffect(() => {
    if (log && !isInitialized) {
      const logDate = new Date(log.logged_at)
      setDate(logDate)

      const totalMinutes = log.value
      setHours(Math.floor(totalMinutes / 60))
      setMinutes(totalMinutes % 60)

      if (log.image_urls && log.image_urls.length > 0) {
        setPhotoUri(log.image_urls[0])
      }

      reset({ note: log.note ?? '' })
      setIsInitialized(true)
    }
  }, [log, isInitialized, reset])

  const totalMinutes = hours * 60 + minutes

  const handlePickPhoto = async () => {
    const uri = await pickImage()
    if (uri) {
      setPhotoUri(uri)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoUri(null)
  }

  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }
    if (selectedDate) {
      const now = new Date()
      setDate(selectedDate > now ? now : selectedDate)
    }
  }

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false)
    }
    if (selectedTime) {
      const newDate = new Date(date)
      newDate.setHours(selectedTime.getHours())
      newDate.setMinutes(selectedTime.getMinutes())
      setDate(newDate)
    }
  }

  const handleFormSubmit = handleSubmit((data) => {
    if (!log || !logId) return
    if (totalMinutes <= 0) return

    updateLog.mutate(
      {
        logId,
        projectId: log.project_id,
        activityId: log.activity_id,
        value: totalMinutes,
        note: data.note || null,
        photoUri: photoUri || undefined,
        loggedAt: date.toISOString(),
      },
      {
        onSuccess: () => {
          router.back()
        },
      }
    )
  })

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    )
  }

  if (!log) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Log</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Log not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Log</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Duration Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Duration</Text>
            <DurationPicker
              hours={hours}
              minutes={minutes}
              onHoursChange={setHours}
              onMinutesChange={setMinutes}
            />
          </View>

          {/* Date & Time Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  setShowDatePicker((prev) => !prev)
                  setShowTimePicker(false)
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  setShowTimePicker((prev) => !prev)
                  setShowDatePicker(false)
                }}
              >
                <Ionicons name="time-outline" size={20} color="#007AFF" />
                <Text style={styles.dateTimeText}>{formatTime(date)}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  setShowDatePicker(false)
                  setShowTimePicker(false)
                }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Note */}
          <View style={styles.section}>
            <ControlledTextArea
              control={control}
              name="note"
              label="Note (optional)"
              placeholder="How did it go? Any thoughts?"
            />
          </View>

          {/* Photo */}
          <View style={styles.section}>
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
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
                <Text style={styles.photoButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (totalMinutes <= 0 || updateLog.isPending) && styles.submitButtonDisabled,
            ]}
            onPress={handleFormSubmit}
            disabled={totalMinutes <= 0 || updateLog.isPending}
          >
            {updateLog.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  doneButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
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
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
})

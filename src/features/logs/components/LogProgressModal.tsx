// src/features/logs/components/LogProgressModal.tsx
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import { pickImage } from '@/lib/storage'
import { useActivities } from '@/features/activities'
import { useCreateLog } from '../hooks/useCreateLog'
import { useLogModal } from '../context/LogModalContext'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']

const logSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
})

type LogFormData = z.infer<typeof logSchema>

export function LogProgressModal() {
  const { isModalVisible, closeModal } = useLogModal()
  const { data: activities, isLoading: activitiesLoading } = useActivities()
  const createLog = useCreateLog()

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      value: '',
      note: '',
    },
  })

  const handleClose = () => {
    reset()
    setSelectedActivity(null)
    setDate(new Date())
    setPhotoUri(null)
    closeModal()
  }

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
      setDate(selectedDate)
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
    if (!selectedActivity) return

    const parsedValue = parseFloat(data.value)
    if (isNaN(parsedValue) || parsedValue <= 0) return

    createLog.mutate(
      {
        activityId: selectedActivity.id,
        value: parsedValue,
        note: data.note || undefined,
        photoUri: photoUri || undefined,
        loggedAt: date.toISOString(),
      },
      {
        onSuccess: () => {
          handleClose()
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

  const valueLabel = selectedActivity ? 'Minutes' : 'Value'

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Log Progress</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Activity Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Activity</Text>
            {activitiesLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : activities && activities.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activityList}
              >
                {activities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    style={[
                      styles.activityChip,
                      selectedActivity?.id === activity.id && styles.activityChipSelected,
                    ]}
                    onPress={() => setSelectedActivity(activity)}
                  >
                    <Text
                      style={[
                        styles.activityChipText,
                        selectedActivity?.id === activity.id && styles.activityChipTextSelected,
                      ]}
                    >
                      {activity.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No activities yet. Create one first!</Text>
            )}
          </View>

          {/* Value Input */}
          <View style={styles.section}>
            <ControlledInput
              control={control}
              name="value"
              label={valueLabel}
              placeholder={`Enter ${valueLabel.toLowerCase()}`}
              keyboardType="numeric"
            />
          </View>

          {/* Date & Time Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
              </Pressable>
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#007AFF" />
                <Text style={styles.dateTimeText}>{formatTime(date)}</Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
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
              (!selectedActivity || createLog.isPending) && styles.submitButtonDisabled,
            ]}
            onPress={handleFormSubmit}
            disabled={!selectedActivity || createLog.isPending}
          >
            {createLog.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Log Progress</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  activityList: {
    gap: 8,
    paddingVertical: 4,
  },
  activityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activityChipTextSelected: {
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
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

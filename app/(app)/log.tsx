// app/(app)/log.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useMemo, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { ControlledTextArea } from '@/components/forms'
import { pickOrTakeImage, uploadLogPhoto } from '@/lib/storage'
import { useActivities, useActivityFields } from '@/features/activities'
import { useAllUserProjects, createProject } from '@/features/projects'
import { createLogWithFields } from '@/features/logs'
import { useAuth } from '@/features/auth'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import type { Database } from '@/types/database'
import type { FieldValue } from '@/types/fields'

type Project = Database['public']['Tables']['projects']['Row']
type Activity = Database['public']['Tables']['activities']['Row']

const logSchema = z.object({
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
})

type LogFormData = z.infer<typeof logSchema>

export default function LogScreen() {
  const { projectId, activityId, mode } = useLocalSearchParams<{ projectId?: string; activityId?: string; mode?: 'activity' }>()
  const isActivityOnlyMode = mode === 'activity'
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: activities, isLoading: activitiesLoading } = useActivities()
  const allProjectsQuery = useAllUserProjects()

  // Extract and properly type the data
  const allProjects: Project[] = allProjectsQuery.data ?? []
  const projectsLoading = allProjectsQuery.isLoading

  // Find pre-selected activity and project from URL params
  const preSelectedActivity = useMemo((): Activity | null => {
    if (activityId && activities) {
      return activities.find((a) => a.id === activityId) ?? null
    }
    // If projectId is provided, derive activity from the project
    if (projectId && allProjects.length > 0 && activities) {
      const project = allProjects.find((p) => p.id === projectId)
      if (project) {
        return activities.find((a) => a.id === project.activity_id) ?? null
      }
    }
    return null
  }, [activityId, projectId, activities, allProjects])

  const preSelectedProject = projectId
    ? allProjects.find((p) => p.id === projectId) ?? null
    : null

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  // Use pre-selected values when available
  const effectiveActivity = selectedActivity ?? preSelectedActivity

  // Find General project for activity-only mode
  const generalProject = useMemo(() => {
    if (!effectiveActivity || !allProjects) return null
    return allProjects.find(
      p => p.activity_id === effectiveActivity.id && p.name === 'General'
    ) ?? null
  }, [effectiveActivity, allProjects])

  // Use selected project, pre-selected, or fallback to General project
  const effectiveProject = useMemo(() => {
    if (selectedProject) return selectedProject
    if (preSelectedProject) return preSelectedProject
    if (generalProject) return generalProject
    return null
  }, [selectedProject, preSelectedProject, generalProject])

  // Fetch fields for the selected activity
  const { data: activityFields, isLoading: fieldsLoading } = useActivityFields(
    effectiveActivity?.id ?? ''
  )

  // Reset field values when activity changes
  useEffect(() => {
    setFieldValues({})
  }, [effectiveActivity?.id])

  // Create log mutation
  const createLogMutation = useMutation({
    mutationFn: async (input: {
      projectId: string
      activityId: string
      fieldValues: Record<string, FieldValue>
      note?: string
      photoUri?: string
      loggedAt: string
    }) => {
      let imageUrls: string[] | undefined
      if (input.photoUri && user) {
        const tempId = `${Date.now()}`
        const uploadedUrl = await uploadLogPhoto(user.id, tempId, input.photoUri)
        imageUrls = [uploadedUrl]
      }

      return createLogWithFields({
        project_id: input.projectId,
        activity_id: input.activityId,
        user_id: user!.id,
        fieldValues: input.fieldValues,
        note: input.note,
        image_urls: imageUrls,
        logged_at: input.loggedAt,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logs', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.activityId] })
      queryClient.invalidateQueries({ queryKey: ['activity-logs', variables.activityId] })
      queryClient.invalidateQueries({ queryKey: ['recent-projects', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  // Filter projects by selected activity (exclude General - it's used behind the scenes)
  const filteredProjects = useMemo((): Project[] => {
    if (!effectiveActivity || !allProjects) return []
    return allProjects.filter((p) => p.activity_id === effectiveActivity.id && p.name !== 'General')
  }, [effectiveActivity, allProjects])

  // Handle activity selection - clears project and field values when activity changes
  const handleActivitySelect = (activity: Activity) => {
    if (selectedActivity?.id !== activity.id) {
      setSelectedProject(null)
      setFieldValues({})
    }
    setSelectedActivity(activity)
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const { control, handleSubmit, reset } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      note: '',
    },
  })

  // Check if at least one field has a value
  const hasFieldValues = Object.values(fieldValues).some((v) => v && v.trim() !== '')

  const handlePickPhoto = async () => {
    const uri = await pickOrTakeImage()
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
      // Clamp to now if selected date is in the future
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

  const handleFormSubmit = handleSubmit(async (data) => {
    if (!effectiveActivity || !user) return

    // Convert string values to proper FieldValue objects
    const processedFieldValues: Record<string, FieldValue> = {}

    activityFields?.forEach((field) => {
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

    // If no project exists (legacy users without General), create one
    let projectId = effectiveProject?.id
    if (!projectId) {
      try {
        const newProject = await createProject({
          activity_id: effectiveActivity.id,
          user_id: user.id,
          name: 'General',
          description: null,
        })
        projectId = newProject.id
        // Invalidate projects cache so it shows up
        queryClient.invalidateQueries({ queryKey: ['projects', effectiveActivity.id] })
        queryClient.invalidateQueries({ queryKey: ['all-projects', user.id] })
      } catch (error) {
        console.error('Failed to create General project:', error)
        return
      }
    }

    createLogMutation.mutate(
      {
        projectId,
        activityId: effectiveActivity.id,
        fieldValues: processedFieldValues,
        note: data.note || undefined,
        photoUri: photoUri || undefined,
        loggedAt: date.toISOString(),
      },
      {
        onSuccess: () => {
          reset()
          setFieldValues({})
          setPhotoUri(null)
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
        <Text style={styles.title}>Log Progress</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Project Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Project</Text>
          {activitiesLoading || projectsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : activities && activities.length > 0 ? (
            <View style={styles.projectPickerContainer}>
              {/* Step 1: Activity Selection */}
              <View style={styles.activityGroup}>
                <Text style={styles.subLabel}>Activity</Text>
                <View style={styles.activityChipList}>
                  {activities?.map((activity) => (
                    <Pressable
                      key={activity.id}
                      style={[
                        styles.projectChip,
                        effectiveActivity?.id === activity.id && styles.projectChipSelected,
                      ]}
                      onPress={() => handleActivitySelect(activity)}
                    >
                      <Text
                        style={[
                          styles.projectChipText,
                          effectiveActivity?.id === activity.id && styles.projectChipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {activity.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Step 2: Project Selection (hidden in activity-only mode) */}
              {effectiveActivity && filteredProjects.length > 0 && !(isActivityOnlyMode && generalProject) && (
                <View style={styles.activityGroup}>
                  <Text style={styles.subLabel}>Project</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.projectList}
                  >
                    {filteredProjects.map((project) => {
                      const isSelected = effectiveProject?.id === project.id && effectiveProject?.name !== 'General'
                      return (
                        <Pressable
                          key={project.id}
                          style={[
                            styles.projectChip,
                            isSelected && styles.projectChipSelected,
                          ]}
                          onPress={() => {
                            // Toggle: if already selected, deselect (use General)
                            if (isSelected) {
                              setSelectedProject(null)
                            } else {
                              setSelectedProject(project)
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.projectChipText,
                              isSelected && styles.projectChipTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {project.name}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>No projects yet. Create one first!</Text>
          )}
        </View>

        {/* Dynamic Field Inputs */}
        {effectiveActivity && (
          <View style={styles.section}>
            <Text style={styles.label}>Fields</Text>
            {fieldsLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : activityFields && activityFields.length > 0 ? (
              <View style={styles.fieldsContainer}>
                {activityFields.map((field) => (
                  <View key={field.id} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>
                      {field.name} ({field.unit})
                      {field.is_primary && <Text style={styles.primaryIndicator}> *</Text>}
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={fieldValues[field.name] ?? ''}
                      onChangeText={(value) => handleFieldChange(field.name, value)}
                      keyboardType={field.field_type === 'text' ? 'default' : 'numeric'}
                      placeholder={`Enter ${field.unit}`}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No fields configured for this activity.</Text>
            )}
          </View>
        )}

        {/* Date & Time Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => {
                setShowDatePicker((prev) => !prev)
                setShowTimePicker(false)
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
            </Pressable>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => {
                setShowTimePicker((prev) => !prev)
                setShowDatePicker(false)
              }}
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
            (!effectiveActivity || createLogMutation.isPending) && styles.submitButtonDisabled,
          ]}
          onPress={handleFormSubmit}
          disabled={!effectiveActivity || createLogMutation.isPending}
        >
          {createLogMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Log Progress</Text>
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
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  projectPickerContainer: {
    gap: 16,
  },
  activityGroup: {
    gap: 8,
  },
  activityChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  projectList: {
    gap: 8,
    paddingVertical: 4,
  },
  projectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: 200,
  },
  projectChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  projectChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  projectChipTextSelected: {
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  fieldsContainer: {
    gap: 12,
  },
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  primaryIndicator: {
    color: '#007AFF',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
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

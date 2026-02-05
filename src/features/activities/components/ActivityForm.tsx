// src/features/activities/components/ActivityForm.tsx
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']

const activitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  goal_total: z.string().optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  category: z.string().max(50, 'Category must be 50 characters or less').optional(),
})

type ActivityFormData = z.infer<typeof activitySchema>

interface ActivityFormProps {
  initialData?: Partial<Activity>
  onSubmit: (data: {
    name: string
    description?: string | null
    category?: string | null
    goal_total?: number | null
  }) => void
  isLoading?: boolean
}

export function ActivityForm({ initialData, onSubmit, isLoading = false }: ActivityFormProps) {
  const {
    control,
    handleSubmit,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: initialData?.name ?? '',
      goal_total: initialData?.goal_total?.toString() ?? '',
      description: initialData?.description ?? '',
      category: initialData?.category ?? '',
    },
  })

  const handleFormSubmit = handleSubmit((data) => {
    // Parse goal_total to number if provided (in hours)
    const goalTotal = data.goal_total ? parseFloat(data.goal_total) : null
    const isValidGoal = goalTotal === null || (goalTotal > 0 && !isNaN(goalTotal))

    if (!isValidGoal) {
      return
    }

    onSubmit({
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      goal_total: goalTotal,
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

      <ControlledInput
        control={control}
        name="goal_total"
        label="Goal (hours)"
        placeholder="Optional"
        keyboardType="numeric"
        style={styles.field}
      />

      <ControlledInput
        control={control}
        name="category"
        label="Category"
        placeholder="e.g., Fitness, Learning, Creative"
        style={styles.field}
      />

      <ControlledTextArea
        control={control}
        name="description"
        label="Description"
        placeholder="What is this activity about?"
        style={styles.field}
      />

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

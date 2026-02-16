// src/features/projects/components/ProjectForm.tsx
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  initialData?: Partial<Project>
  onSubmit: (data: { name: string; description?: string | null }) => void
  isLoading?: boolean
}

export function ProjectForm({ initialData, onSubmit, isLoading = false }: ProjectFormProps) {
  const { control, handleSubmit } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
    },
  })

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      name: data.name,
      description: data.description || null,
    })
  })

  return (
    <View style={styles.container}>
      <ControlledInput
        control={control}
        name="name"
        label="Project Name"
        placeholder="e.g., Marathon Training, Learn Spanish"
        style={styles.field}
      />

      <ControlledTextArea
        control={control}
        name="description"
        label="Description"
        placeholder="What is this project about?"
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
            {initialData ? 'Update Project' : 'Create Project'}
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

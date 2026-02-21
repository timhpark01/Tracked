// src/features/projects/components/ProjectForm.tsx
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Text, ScrollView } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

// Predefined color palette
const PROJECT_COLORS = [
  '#007AFF', // Blue (default)
  '#34C759', // Green
  '#FF9500', // Orange
  '#FF3B30', // Red
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#5856D6', // Indigo
  '#00C7BE', // Teal
  '#FFD60A', // Yellow
  '#8E8E93', // Gray
]

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  initialData?: Partial<Project>
  onSubmit: (data: { name: string; description?: string | null; color?: string }) => void
  isLoading?: boolean
}

export function ProjectForm({ initialData, onSubmit, isLoading = false }: ProjectFormProps) {
  const [selectedColor, setSelectedColor] = useState(initialData?.color ?? '#007AFF')

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
      color: selectedColor,
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

      {/* Color Picker */}
      <View style={styles.field}>
        <Text style={styles.colorLabel}>Color</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorList}
        >
          {PROJECT_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  colorList: {
    gap: 10,
    paddingVertical: 4,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
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

// app/(app)/activities/new.tsx
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { useCreateActivity, useReplaceActivityFields } from '@/features/activities'
import { ActivityForm } from '@/features/activities/components/ActivityForm'
import { TemplatePicker } from '@/features/activities/components/TemplatePicker'
import { useAuth } from '@/features/auth'
import type { TemplateWithFields } from '@/types/fields'
import type { FieldDefinition } from '@/features/activities/components/FieldEditor'

export default function NewActivityScreen() {
  const { user } = useAuth()
  const createActivity = useCreateActivity()
  const createFields = useReplaceActivityFields()
  const [showTemplatePicker, setShowTemplatePicker] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithFields | null>(null)

  const handleTemplateSelect = (template: TemplateWithFields | null) => {
    setSelectedTemplate(template)
    setShowTemplatePicker(false)
  }

  const handleSubmit = async (data: {
    name: string
    description?: string | null
    fields: FieldDefinition[]
  }) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an activity')
      return
    }

    try {
      // Create the activity
      const activity = await createActivity.mutateAsync({
        user_id: user.id,
        name: data.name,
        description: data.description,
      })

      // Create the fields (using replace hook - works for new activities too)
      if (data.fields.length > 0) {
        await createFields.mutateAsync({
          activityId: activity.id,
          fields: data.fields.map((field, index) => ({
            name: field.name,
            field_type: field.fieldType,
            unit: field.unit,
            display_order: index,
            is_primary: field.isPrimary,
          })),
        })
      }

      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create activity')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>New Activity</Text>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => setShowTemplatePicker(true)}
          >
            <Text style={styles.templateButtonText}>Templates</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <ActivityForm
            template={selectedTemplate}
            onSubmit={handleSubmit}
            isLoading={createActivity.isPending || createFields.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <TemplatePicker
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleTemplateSelect}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  templateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  templateButtonText: {
    color: '#007AFF',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
})

// app/(app)/activities/[id]/edit.tsx
import { View, ActivityIndicator, StyleSheet, Alert, ScrollView, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useActivity, useUpdateActivity, useActivityFields, useReplaceActivityFields } from '@/features/activities'
import { ActivityForm } from '@/features/activities/components/ActivityForm'
import type { FieldDefinition } from '@/features/activities/components/FieldEditor'

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: activity, isLoading, error } = useActivity(id ?? '')
  const { data: existingFields, isLoading: fieldsLoading } = useActivityFields(id ?? '')
  const updateActivity = useUpdateActivity()
  const replaceFields = useReplaceActivityFields()

  // Convert DB fields to FieldDefinition format
  const initialFields: FieldDefinition[] | undefined = existingFields?.map((f) => ({
    id: f.id,
    name: f.name,
    fieldType: f.field_type,
    unit: f.unit,
    isPrimary: f.is_primary,
  }))

  if (isLoading || fieldsLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !activity) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Activity</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Activity not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleSubmit = async (data: {
    name: string
    description?: string | null
    fields: FieldDefinition[]
  }) => {
    try {
      // Update activity details
      await updateActivity.mutateAsync({
        activityId: activity.id,
        updates: {
          name: data.name,
          description: data.description,
        },
      })

      // Update fields (uses hook which handles cache invalidation)
      await replaceFields.mutateAsync({
        activityId: activity.id,
        fields: data.fields.map((field, index) => ({
          name: field.name,
          field_type: field.fieldType,
          unit: field.unit,
          display_order: index,
          is_primary: field.isPrimary,
        })),
      })

      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update activity')
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
          <Text style={styles.title}>Edit Activity</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <ActivityForm
            initialData={activity}
            initialFields={initialFields}
            onSubmit={handleSubmit}
            isLoading={updateActivity.isPending || replaceFields.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
  },
})

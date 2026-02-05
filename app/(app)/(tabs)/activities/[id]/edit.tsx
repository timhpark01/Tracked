// app/(app)/activities/[id]/edit.tsx
import { View, ActivityIndicator, StyleSheet, Alert, ScrollView, Text, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useActivity, useUpdateActivity } from '@/features/activities'
import { ActivityForm } from '@/features/activities/components/ActivityForm'

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: activity, isLoading, error } = useActivity(id ?? '')
  const updateActivity = useUpdateActivity()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (error || !activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Activity not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleSubmit = async (data: {
    name: string
    description?: string | null
    category?: string | null
    goal_total?: number | null
  }) => {
    try {
      await updateActivity.mutateAsync({
        activityId: activity.id,
        updates: {
          name: data.name,
          description: data.description,
          category: data.category,
          goal_total: data.goal_total,
        },
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update activity')
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <ActivityForm
        initialData={activity}
        onSubmit={handleSubmit}
        isLoading={updateActivity.isPending}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
})

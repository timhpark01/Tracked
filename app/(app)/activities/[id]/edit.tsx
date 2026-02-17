// app/(app)/activities/[id]/edit.tsx
import { View, ActivityIndicator, StyleSheet, Alert, ScrollView, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useActivity, useUpdateActivity } from '@/features/activities'
import { ActivityForm } from '@/features/activities/components/ActivityForm'

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: activity, isLoading, error } = useActivity(id ?? '')
  const updateActivity = useUpdateActivity()

  if (isLoading) {
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
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#6b7280" />
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
    category?: string | null
  }) => {
    try {
      await updateActivity.mutateAsync({
        activityId: activity.id,
        updates: {
          name: data.name,
          description: data.description,
          category: data.category,
        },
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update activity')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Activity</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <ActivityForm
          initialData={activity}
          onSubmit={handleSubmit}
          isLoading={updateActivity.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
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

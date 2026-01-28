// app/(app)/hobbies/[id]/edit.tsx
import { View, ActivityIndicator, StyleSheet, Alert, ScrollView, Text, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useHobby, useUpdateHobby } from '@/features/hobbies'
import { HobbyForm } from '@/features/hobbies/components/HobbyForm'

export default function EditHobbyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: hobby, isLoading, error } = useHobby(id ?? '')
  const updateHobby = useUpdateHobby()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (error || !hobby) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Hobby not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleSubmit = async (data: {
    name: string
    tracking_type: 'time' | 'quantity'
    description?: string | null
    category?: string | null
    goal_total?: number | null
    goal_unit?: string | null
  }) => {
    try {
      await updateHobby.mutateAsync({
        hobbyId: hobby.id,
        updates: {
          name: data.name,
          tracking_type: data.tracking_type,
          description: data.description,
          category: data.category,
          goal_total: data.goal_total,
          goal_unit: data.goal_unit,
        },
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update hobby')
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <HobbyForm
        initialData={hobby}
        onSubmit={handleSubmit}
        isLoading={updateHobby.isPending}
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

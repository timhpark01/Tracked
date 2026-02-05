// app/(app)/activities/new.tsx
import { View, StyleSheet, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useCreateActivity } from '@/features/activities'
import { ActivityForm } from '@/features/activities/components/ActivityForm'
import { useAuth } from '@/features/auth'

export default function NewActivityScreen() {
  const { user } = useAuth()
  const createActivity = useCreateActivity()

  const handleSubmit = async (data: {
    name: string
    description?: string | null
    category?: string | null
    goal_total?: number | null
  }) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an activity')
      return
    }

    try {
      await createActivity.mutateAsync({
        user_id: user.id,
        name: data.name,
        description: data.description,
        category: data.category,
        goal_total: data.goal_total,
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create activity')
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <ActivityForm onSubmit={handleSubmit} isLoading={createActivity.isPending} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})

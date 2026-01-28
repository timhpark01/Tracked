// app/(app)/hobbies/new.tsx
import { View, StyleSheet, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useCreateHobby } from '@/features/hobbies'
import { HobbyForm } from '@/features/hobbies/components/HobbyForm'
import { useAuth } from '@/features/auth'

export default function NewHobbyScreen() {
  const { user } = useAuth()
  const createHobby = useCreateHobby()

  const handleSubmit = async (data: {
    name: string
    tracking_type: 'time' | 'quantity'
    description?: string | null
    category?: string | null
    goal_total?: number | null
    goal_unit?: string | null
  }) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a hobby')
      return
    }

    try {
      await createHobby.mutateAsync({
        user_id: user.id,
        name: data.name,
        tracking_type: data.tracking_type,
        description: data.description,
        category: data.category,
        goal_total: data.goal_total,
        goal_unit: data.goal_unit,
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create hobby')
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <HobbyForm onSubmit={handleSubmit} isLoading={createHobby.isPending} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})

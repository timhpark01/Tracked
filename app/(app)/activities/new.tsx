// app/(app)/activities/new.tsx
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create activity')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>New Activity</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <ActivityForm onSubmit={handleSubmit} isLoading={createActivity.isPending} />
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
})

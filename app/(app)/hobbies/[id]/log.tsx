// app/(app)/hobbies/[id]/log.tsx
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useHobby } from '@/features/hobbies'
import { useCreateLog, LogForm } from '@/features/logs'

export default function LogProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: hobby, isLoading: hobbyLoading } = useHobby(id ?? '')
  const createLog = useCreateLog()

  if (hobbyLoading || !hobby) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  const handleSubmit = async (data: { value: number; note?: string; photoUri?: string }) => {
    try {
      await createLog.mutateAsync({
        hobbyId: hobby.id,
        value: data.value,
        note: data.note,
        photoUri: data.photoUri,
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create log')
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Progress</Text>
        <Text style={styles.subtitle}>{hobby.name}</Text>
      </View>
      <LogForm
        trackingType={hobby.tracking_type}
        goalUnit={hobby.goal_unit}
        onSubmit={handleSubmit}
        isLoading={createLog.isPending}
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
  },
  header: {
    padding: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
})

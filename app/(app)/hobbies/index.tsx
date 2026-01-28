// app/(app)/hobbies/index.tsx
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useHobbies } from '@/features/hobbies'
import { HobbyList } from '@/features/hobbies/components/HobbyList'

export default function HobbiesScreen() {
  const { data: hobbies, isLoading, error } = useHobbies()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load hobbies</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <HobbyList
        hobbies={hobbies ?? []}
        onHobbyPress={(id) => router.push(`/hobbies/${id}`)}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/hobbies/new')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#fff',
    marginTop: -2,
  },
})

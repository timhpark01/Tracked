// src/features/hobbies/components/HobbyList.tsx
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { HobbyCard } from './HobbyCard'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']

interface HobbyListProps {
  hobbies: Hobby[]
  onHobbyPress: (id: string) => void
}

export function HobbyList({ hobbies, onHobbyPress }: HobbyListProps) {
  if (hobbies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No hobbies yet</Text>
        <Text style={styles.emptyText}>
          Create your first hobby to start tracking your progress!
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={hobbies}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HobbyCard hobby={item} onPress={() => onHobbyPress(item.id)} />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
})

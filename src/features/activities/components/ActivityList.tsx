// src/features/activities/components/ActivityList.tsx
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { ActivityCard } from './ActivityCard'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']

interface ActivityListProps {
  activities: Activity[]
  onActivityPress: (id: string) => void
}

export function ActivityList({ activities, onActivityPress }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No activities yet</Text>
        <Text style={styles.emptyText}>
          Create your first activity to start tracking your progress!
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ActivityCard activity={item} onPress={() => onActivityPress(item.id)} />
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

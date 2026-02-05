// src/features/activities/components/ActivityCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']

interface ActivityCardProps {
  activity: Activity
  onPress?: () => void
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.name}>{activity.name}</Text>

      {activity.description && (
        <Text style={styles.description} numberOfLines={2}>
          {activity.description}
        </Text>
      )}

      {activity.goal_total && (
        <View style={styles.goalContainer}>
          <Text style={styles.goalLabel}>Goal:</Text>
          <Text style={styles.goalValue}>{activity.goal_total} hours</Text>
        </View>
      )}

      {activity.category && (
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{activity.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  goalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 4,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryContainer: {
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
})

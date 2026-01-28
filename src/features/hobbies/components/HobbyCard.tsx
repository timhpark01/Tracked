// src/features/hobbies/components/HobbyCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']

interface HobbyCardProps {
  hobby: Hobby
  onPress?: () => void
}

export function HobbyCard({ hobby, onPress }: HobbyCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{hobby.name}</Text>
        <View
          style={[
            styles.badge,
            hobby.tracking_type === 'time' ? styles.badgeTime : styles.badgeQuantity,
          ]}
        >
          <Text style={styles.badgeText}>
            {hobby.tracking_type === 'time' ? 'Time' : 'Quantity'}
          </Text>
        </View>
      </View>

      {hobby.description && (
        <Text style={styles.description} numberOfLines={2}>
          {hobby.description}
        </Text>
      )}

      {hobby.goal_total && (
        <View style={styles.goalContainer}>
          <Text style={styles.goalLabel}>Goal:</Text>
          <Text style={styles.goalValue}>
            {hobby.goal_total}
            {hobby.tracking_type === 'time'
              ? ' hours'
              : hobby.goal_unit
              ? ` ${hobby.goal_unit}`
              : ' units'}
          </Text>
        </View>
      )}

      {hobby.category && (
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{hobby.category}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTime: {
    backgroundColor: '#dbeafe', // blue-100
  },
  badgeQuantity: {
    backgroundColor: '#dcfce7', // green-100
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  description: {
    fontSize: 14,
    color: '#6b7280', // gray-500
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
    color: '#9ca3af', // gray-400
    fontStyle: 'italic',
  },
})

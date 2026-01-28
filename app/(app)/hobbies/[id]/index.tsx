// app/(app)/hobbies/[id]/index.tsx
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useHobby, useDeleteHobby } from '@/features/hobbies'

export default function HobbyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: hobby, isLoading, error } = useHobby(id ?? '')
  const deleteHobby = useDeleteHobby()

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Hobby',
      `Are you sure you want to delete "${hobby.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHobby.mutateAsync(hobby.id)
              router.replace('/hobbies')
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete hobby')
            }
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.container}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{hobby.description}</Text>
        </View>
      )}

      {hobby.category && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.categoryText}>{hobby.category}</Text>
        </View>
      )}

      {hobby.goal_total && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal</Text>
          <Text style={styles.goalText}>
            {hobby.goal_total}
            {hobby.tracking_type === 'time'
              ? ' hours'
              : hobby.goal_unit
              ? ` ${hobby.goal_unit}`
              : ' units'}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Created</Text>
        <Text style={styles.dateText}>
          {new Date(hobby.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => {
            // Placeholder - will be connected in 02-04
            Alert.alert('Coming Soon', 'Log progress functionality will be added in the next update.')
          }}
        >
          <Text style={styles.logButtonText}>Log Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/hobbies/${hobby.id}/edit`)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleteHobby.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {deleteHobby.isPending ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeTime: {
    backgroundColor: '#dbeafe',
  },
  badgeQuantity: {
    backgroundColor: '#dcfce7',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  section: {
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  categoryText: {
    fontSize: 16,
    color: '#374151',
  },
  goalText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  dateText: {
    fontSize: 16,
    color: '#6b7280',
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  logButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
})

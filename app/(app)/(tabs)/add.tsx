import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useActivities } from '@/features/activities'
import { useAuth } from '@/features/auth'

export default function AddEntryScreen() {
  const { user, loading: authLoading } = useAuth()
  const { data: activities, isLoading: activitiesLoading } = useActivities()

  // Show loading if auth is loading or activities query is loading
  if (authLoading || (user && activitiesLoading)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No activities yet</Text>
        <Text style={styles.emptySubtitle}>
          Create an activity first to start logging your progress
        </Text>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push('/activities/new')}
        >
          <Text style={styles.createButtonText}>Create Activity</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Entry</Text>
        <Text style={styles.subtitle}>Select an activity to log progress</Text>
      </View>

      <View style={styles.list}>
        {activities.map((activity) => (
          <Pressable
            key={activity.id}
            style={styles.activityItem}
            onPress={() => router.push(`/activities/${activity.id}/log`)}
          >
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{activity.name}</Text>
              {activity.category && (
                <Text style={styles.activityType}>{activity.category}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.newActivityButton}
        onPress={() => router.push('/activities/new')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.newActivityText}>Create New Activity</Text>
      </Pressable>
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
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  activityType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  newActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  newActivityText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

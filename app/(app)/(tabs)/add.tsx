import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { useActivities } from '@/features/activities'
import { useAllUserProjects } from '@/features/projects'
import { useAuth } from '@/features/auth'

export default function AddEntryScreen() {
  const { user, loading: authLoading } = useAuth()
  const { data: activities, isLoading: activitiesLoading } = useActivities()
  const { data: allProjects, isLoading: projectsLoading } = useAllUserProjects()

  // Count projects per activity
  const activityStats = useMemo(() => {
    if (!allProjects || !activities) return new Map()

    const stats = new Map<string, number>()
    activities.forEach((activity) => {
      const count = allProjects.filter((p) => p.activity_id === activity.id).length
      stats.set(activity.id, count)
    })
    return stats
  }, [allProjects, activities])

  // Show loading if auth is loading or queries are loading
  if (authLoading || (user && (activitiesLoading || projectsLoading))) {
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
        <Text style={styles.title}>Activities</Text>
        <Text style={styles.subtitle}>Select an activity to view projects and log progress</Text>
      </View>

      <View style={styles.cardList}>
        {activities.map((activity) => {
          const projectCount = activityStats.get(activity.id) ?? 0
          return (
            <Pressable
              key={activity.id}
              style={styles.activityCard}
              onPress={() => router.push(`/activities/${activity.id}`)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.activityName}>{activity.name}</Text>
                {activity.description && (
                  <Text style={styles.activityDescription} numberOfLines={2}>
                    {activity.description}
                  </Text>
                )}
                <View style={styles.cardMeta}>
                  <Text style={styles.projectCount}>
                    {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          )
        })}
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
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
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
  cardList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectCount: {
    fontSize: 13,
    color: '#9ca3af',
  },
  newActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: '#fff',
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
    backgroundColor: '#f9fafb',
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

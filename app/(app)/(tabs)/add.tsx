import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { useActivities, useReorderActivities } from '@/features/activities'
import { useAllUserProjects } from '@/features/projects'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']

export default function AddEntryScreen() {
  const { user, loading: authLoading } = useAuth()
  const { data: activities, isLoading: activitiesLoading } = useActivities()
  const { data: allProjects, isLoading: projectsLoading } = useAllUserProjects()
  const reorderActivities = useReorderActivities()

  const [isEditMode, setIsEditMode] = useState(false)
  const [localActivities, setLocalActivities] = useState<Activity[]>([])

  // Sync local activities when data changes and not in edit mode
  useEffect(() => {
    if (activities && !isEditMode) {
      setLocalActivities(activities)
    }
  }, [activities, isEditMode])

  const handleEnterEditMode = useCallback(() => {
    if (activities) {
      setLocalActivities(activities)
    }
    setIsEditMode(true)
  }, [activities])

  const handleExitEditMode = useCallback(() => {
    setIsEditMode(false)
    // Reset to original order
    if (activities) {
      setLocalActivities(activities)
    }
  }, [activities])

  const handleSaveOrder = useCallback(async () => {
    const activityIds = localActivities.map((a) => a.id)
    await reorderActivities.mutateAsync(activityIds)
    setIsEditMode(false)
  }, [localActivities, reorderActivities])

  const moveActivity = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= localActivities.length) return

    const newActivities = [...localActivities]
    const [removed] = newActivities.splice(index, 1)
    newActivities.splice(newIndex, 0, removed)
    setLocalActivities(newActivities)
  }, [localActivities])

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

  // Use local activities when in edit mode, otherwise use fetched activities
  const displayActivities = isEditMode ? localActivities : (activities ?? [])

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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Activities</Text>
            <Text style={styles.subtitle}>
              {isEditMode ? 'Drag to reorder activities' : 'Select an activity to view projects and log progress'}
            </Text>
          </View>
          {!isEditMode ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEnterEditMode}>
              <Ionicons name="reorder-three" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleExitEditMode}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, reorderActivities.isPending && styles.saveButtonDisabled]}
                onPress={handleSaveOrder}
                disabled={reorderActivities.isPending}
              >
                {reorderActivities.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardList}>
        {displayActivities.map((activity, index) => {
          const projectCount = activityStats.get(activity.id) ?? 0
          return (
            <Pressable
              key={activity.id}
              style={[styles.activityCard, isEditMode && styles.activityCardEditMode]}
              onPress={() => !isEditMode && router.push(`/activities/${activity.id}`)}
            >
              {isEditMode && (
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                    onPress={() => moveActivity(index, 'up')}
                    disabled={index === 0}
                  >
                    <Ionicons name="chevron-up" size={20} color={index === 0 ? '#d1d5db' : '#007AFF'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reorderButton, index === displayActivities.length - 1 && styles.reorderButtonDisabled]}
                    onPress={() => moveActivity(index, 'down')}
                    disabled={index === displayActivities.length - 1}
                  >
                    <Ionicons name="chevron-down" size={20} color={index === displayActivities.length - 1 ? '#d1d5db' : '#007AFF'} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.activityName}>{activity.name}</Text>
                {activity.description && !isEditMode && (
                  <Text style={styles.activityDescription} numberOfLines={2}>
                    {activity.description}
                  </Text>
                )}
                {!isEditMode && (
                  <View style={styles.cardMeta}>
                    <Text style={styles.projectCount}>
                      {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                    </Text>
                  </View>
                )}
              </View>
              {!isEditMode && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
              {isEditMode && (
                <View style={styles.dragHandle}>
                  <Ionicons name="menu" size={20} color="#9ca3af" />
                </View>
              )}
            </Pressable>
          )
        })}
      </View>

      {!isEditMode && (
        <Pressable
          style={styles.newActivityButton}
          onPress={() => router.push('/activities/new')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.newActivityText}>Create New Activity</Text>
        </Pressable>
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    maxWidth: 240,
  },
  editButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
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
  activityCardEditMode: {
    paddingVertical: 12,
  },
  reorderButtons: {
    marginRight: 12,
    gap: 2,
  },
  reorderButton: {
    padding: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },
  dragHandle: {
    padding: 4,
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

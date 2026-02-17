// app/(app)/activities/[id]/index.tsx
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useActivity, useDeleteActivity } from '@/features/activities'
import { useProjects } from '@/features/projects'
import { getLogsByActivity } from '@/features/logs'
import { useQuery } from '@tanstack/react-query'

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: activity, isLoading, error } = useActivity(id ?? '')
  const { data: projects, isLoading: projectsLoading } = useProjects(id ?? '')
  const deleteActivity = useDeleteActivity()

  // Fetch all logs for this activity to compute analytics
  const { data: logs } = useQuery({
    queryKey: ['activity-logs', id],
    queryFn: () => getLogsByActivity(id ?? ''),
    enabled: !!id,
  })

  // Compute analytics
  const analytics = useMemo(() => {
    if (!logs) return { totalLogs: 0, totalMinutes: 0, totalHours: 0 }

    const totalLogs = logs.length
    const totalMinutes = logs.reduce((sum, log) => sum + log.value, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    return { totalLogs, totalMinutes, totalHours, remainingMinutes }
  }, [logs])

  // Compute project stats
  const projectStats = useMemo(() => {
    if (!projects || !logs) return new Map()

    const stats = new Map<string, { logCount: number; totalMinutes: number; lastLoggedAt: string | null }>()

    projects.forEach((project) => {
      const projectLogs = logs.filter((log) => log.project_id === project.id)
      const totalMinutes = projectLogs.reduce((sum, log) => sum + log.value, 0)
      const lastLog = projectLogs[0] // logs are sorted by logged_at desc
      stats.set(project.id, {
        logCount: projectLogs.length,
        totalMinutes,
        lastLoggedAt: lastLog?.logged_at ?? null,
      })
    })

    return stats
  }, [projects, logs])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    )
  }

  if (error || !activity) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Activity not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}"? This will delete all projects and logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity.mutateAsync(activity.id)
              router.back()
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete activity')
            }
          },
        },
      ]
    )
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatLastLogged = (date: string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString()
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push(`/activities/${activity.id}/edit`)}
        >
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Activity Info */}
        <View style={styles.header}>
          <Text style={styles.name}>{activity.name}</Text>
          {activity.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{activity.category}</Text>
            </View>
          )}
          {activity.description && (
            <Text style={styles.description}>{activity.description}</Text>
          )}
        </View>

        {/* Analytics Section */}
        <View style={styles.analyticsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.totalLogs}</Text>
              <Text style={styles.statLabel}>Total Logs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDuration(analytics.totalMinutes)}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{projects?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
          </View>
        </View>

        {/* Projects Section */}
        <View style={styles.projectsSection}>
          <View style={styles.projectsHeader}>
            <Text style={styles.sectionTitle}>Projects</Text>
            <TouchableOpacity
              style={styles.addProjectButton}
              onPress={() => router.push(`/activities/${activity.id}/projects/new`)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addProjectButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {projectsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
          ) : projects && projects.length > 0 ? (
            <View style={styles.projectsList}>
              {projects.map((project) => {
                const stats = projectStats.get(project.id)
                return (
                  <Pressable
                    key={project.id}
                    style={styles.projectCard}
                    onPress={() => router.push(`/activities/${activity.id}/projects/${project.id}`)}
                  >
                    <View style={styles.projectCardContent}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      {project.description && (
                        <Text style={styles.projectDescription} numberOfLines={1}>
                          {project.description}
                        </Text>
                      )}
                      <View style={styles.projectMeta}>
                        <Text style={styles.projectStat}>
                          {stats?.logCount ?? 0} logs
                        </Text>
                        <Text style={styles.projectStatDot}>•</Text>
                        <Text style={styles.projectStat}>
                          {formatDuration(stats?.totalMinutes ?? 0)}
                        </Text>
                        <Text style={styles.projectStatDot}>•</Text>
                        <Text style={styles.projectStat}>
                          {formatLastLogged(stats?.lastLoggedAt ?? null)}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <View style={styles.emptyProjects}>
              <Ionicons name="folder-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubtext}>Create a project to start logging</Text>
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteActivity.isPending}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.deleteButtonText}>
              {deleteActivity.isPending ? 'Deleting...' : 'Delete Activity'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  editBtn: {
    padding: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 12,
    lineHeight: 22,
  },
  analyticsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  projectsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  projectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addProjectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 24,
  },
  projectsList: {
    gap: 10,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  projectCardContent: {
    flex: 1,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  projectStat: {
    fontSize: 13,
    color: '#9ca3af',
  },
  projectStatDot: {
    fontSize: 13,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  emptyProjects: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  dangerSection: {
    padding: 20,
    marginTop: 12,
    marginBottom: 32,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
})

// app/(app)/(tabs)/activities/[id]/projects/[projectId].tsx
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProject, useDeleteProject } from '@/features/projects'
import { useLogs, useDeleteLog, LogHistory } from '@/features/logs'

export default function ProjectDetailScreen() {
  const { id: activityId, projectId } = useLocalSearchParams<{ id: string; projectId: string }>()
  const { data: project, isLoading, error } = useProject(projectId ?? '')
  const { data: logs, isLoading: logsLoading } = useLogs(projectId ?? '')
  const deleteProject = useDeleteProject()
  const deleteLog = useDeleteLog()

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !project) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Project not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This will also delete all logs in this project.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject.mutateAsync({
                projectId: project.id,
                activityId: activityId ?? '',
                userId: project.user_id,
              })
              router.back()
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete project')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{project.name}</Text>
        </View>

        {project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{project.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created</Text>
          <Text style={styles.dateText}>
            {new Date(project.created_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => router.push(`/log?projectId=${project.id}&activityId=${activityId}`)}
          >
            <Text style={styles.logButtonText}>Log Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/activities/${activityId}/projects/${project.id}/edit`)}
          >
            <Text style={styles.editButtonText}>Edit Project</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteProject.isPending}
          >
            <Text style={styles.deleteButtonText}>
              {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Log History</Text>
          {logsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.logsLoader} />
          ) : (
            <LogHistory
              logs={logs ?? []}
              unit="minutes"
              onDeleteLog={(logId) =>
                deleteLog.mutate({ logId, projectId: project.id })
              }
            />
          )}
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
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
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
  historySection: {
    paddingTop: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  logsLoader: {
    marginVertical: 24,
  },
})

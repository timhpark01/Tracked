// app/(app)/profile/activity/[id].tsx
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useActivity, useDeleteActivity } from '@/features/activities'
import { useProjects, ProjectList } from '@/features/projects'

export default function ProfileActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: activity, isLoading, error } = useActivity(id ?? '')
  const { data: projects, isLoading: projectsLoading } = useProjects(id ?? '')
  const deleteActivity = useDeleteActivity()

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
      `Are you sure you want to delete "${activity.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity.mutateAsync(activity.id)
              router.back()
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete activity')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push(`/activities/${activity.id}/edit`)}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleDelete}
            disabled={deleteActivity.isPending}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{activity.name}</Text>
          {activity.description && (
            <Text style={styles.description}>{activity.description}</Text>
          )}
        </View>

        <View style={styles.projectsSection}>
        <View style={styles.projectsHeader}>
          <Text style={styles.projectsTitle}>Projects</Text>
          <TouchableOpacity
            style={styles.addProjectButton}
            onPress={() => router.push(`/activities/${activity.id}/projects/new`)}
          >
            <Text style={styles.addProjectButtonText}>+ Add Project</Text>
          </TouchableOpacity>
        </View>
        {projectsLoading ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.projectsLoader} />
        ) : (
          <ProjectList
            projects={projects ?? []}
            onProjectPress={(project) =>
              router.push(`/activities/${activity.id}/projects/${project.id}`)
            }
            emptyMessage="No projects yet. Create one to start logging!"
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
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
  description: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 12,
    lineHeight: 22,
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
    marginBottom: 12,
  },
  projectsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addProjectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  addProjectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  projectsLoader: {
    marginVertical: 24,
  },
})

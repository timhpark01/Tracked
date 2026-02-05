// app/(app)/profile/activity/[id].tsx
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useActivity, useDeleteActivity } from '@/features/activities'
import { useLogs, useDeleteLog, LogHistory } from '@/features/logs'
import { useActivityStats, ProgressBar } from '@/features/stats'

export default function ProfileActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: activity, isLoading, error } = useActivity(id ?? '')
  const { data: logs, isLoading: logsLoading } = useLogs(id ?? '')
  const { data: stats } = useActivityStats(id ?? '')
  const deleteActivity = useDeleteActivity()
  const deleteLog = useDeleteLog()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (error || !activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Activity not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{activity.name}</Text>
      </View>

      {activity.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{activity.description}</Text>
        </View>
      )}

      {activity.category && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.categoryText}>{activity.category}</Text>
        </View>
      )}

      {activity.goal_total && stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <ProgressBar
            progress={stats.progressPercent}
            total={stats.goalTotal ?? 0}
            current={stats.totalValue}
            unit="minutes"
            style={styles.progressBar}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.logCount ?? 0}</Text>
            <Text style={styles.statLabel}>logs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalValue ?? 0}</Text>
            <Text style={styles.statLabel}>minutes</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Created</Text>
        <Text style={styles.dateText}>
          {new Date(activity.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => router.push(`/activities/${activity.id}/log`)}
        >
          <Text style={styles.logButtonText}>Log Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/activities/${activity.id}/edit`)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleteActivity.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {deleteActivity.isPending ? 'Deleting...' : 'Delete'}
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
              deleteLog.mutate({ logId, activityId: activity.id })
            }
          />
        )}
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
  categoryText: {
    fontSize: 16,
    color: '#374151',
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
  progressBar: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  statItem: {
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
    marginTop: 2,
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

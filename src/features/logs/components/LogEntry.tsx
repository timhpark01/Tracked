// src/features/logs/components/LogEntry.tsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { Database } from '@/types/database'
import { parseLogMetadata } from '@/types/fields'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

interface ProjectInfo {
  name: string
  color: string | null
}

interface LogEntryProps {
  log: ActivityLog
  unit?: string
  project?: ProjectInfo
  onDelete?: () => void
  onEdit?: () => void
}

export function LogEntry({ log, unit, project, onDelete, onEdit }: LogEntryProps) {
  const projectColor = project?.color ?? '#007AFF'
  const showProjectName = project && project.name !== 'General'
  const handleDelete = () => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this log entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    )
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      router.push(`/log/edit/${log.id}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const truncateNote = (note: string, maxLength = 100) => {
    if (note.length <= maxLength) return note
    return note.substring(0, maxLength).trim() + '...'
  }

  // Parse field values from metadata for secondary fields only
  const logMetadata = parseLogMetadata(log.metadata)
  const fieldEntries = Object.entries(logMetadata.fields)

  // Always use log.value for primary display (single source of truth)
  const primaryValue = log.value
  const primaryField = fieldEntries[0]
  const primaryUnit = primaryField ? primaryField[1].unit : unit || 'minutes'

  // Get secondary fields (all except primary)
  const secondaryFields = fieldEntries.slice(1)

  return (
    <View style={styles.container}>
      {/* Timeline elements */}
      <View style={styles.timeline}>
        <View style={[styles.timelineDot, { backgroundColor: projectColor }]} />
        <View style={styles.timelineLine} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Project name and date header */}
        <View style={styles.headerRow}>
          {showProjectName && (
            <View style={[styles.projectBadge, { backgroundColor: projectColor }]}>
              <Text style={styles.projectBadgeText}>{project.name}</Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(log.logged_at)}</Text>
        </View>

        {/* Value row with actions */}
        <View style={styles.valueRow}>
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{primaryValue}</Text>
            <Text style={styles.unit}>{primaryUnit}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Secondary field values */}
        {secondaryFields.length > 0 && (
          <View style={styles.secondaryFields}>
            {secondaryFields.map(([name, fieldValue]) => (
              <View key={name} style={styles.secondaryField}>
                <Text style={styles.secondaryLabel}>{name}:</Text>
                <Text style={styles.secondaryValue}>
                  {fieldValue.value} {fieldValue.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Note */}
        {log.note && (
          <Text style={styles.note}>{truncateNote(log.note)}</Text>
        )}

        {/* Image */}
        {log.image_urls && log.image_urls.length > 0 && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: log.image_urls[0] }} style={styles.thumbnail} />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 8,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  projectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  secondaryFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  secondaryField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secondaryLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  secondaryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  note: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 4,
  },
  imageContainer: {
    marginTop: 10,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
})

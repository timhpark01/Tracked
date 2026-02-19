// src/features/logs/components/LogEntry.tsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import type { Database } from '@/types/database'
import { parseLogMetadata, type FieldValue } from '@/types/fields'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

interface LogEntryProps {
  log: ActivityLog
  unit?: string
  onDelete?: () => void
  onEdit?: () => void
}

export function LogEntry({ log, unit, onDelete, onEdit }: LogEntryProps) {
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

  // Parse field values from metadata
  const logMetadata = parseLogMetadata(log.metadata)
  const fieldEntries = Object.entries(logMetadata.fields)
  const hasFieldValues = fieldEntries.length > 0

  // Get primary field value for main display
  const primaryField = fieldEntries[0]
  const primaryValue = primaryField ? primaryField[1].value : log.value
  const primaryUnit = primaryField ? primaryField[1].unit : unit || 'units'

  // Get secondary fields (all except primary)
  const secondaryFields = fieldEntries.slice(1)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{primaryValue}</Text>
          <Text style={styles.unit}>{primaryUnit}</Text>
        </View>
        <Text style={styles.date}>{formatDate(log.logged_at)}</Text>
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

      {log.note && (
        <Text style={styles.note}>{truncateNote(log.note)}</Text>
      )}

      {log.image_urls && log.image_urls.length > 0 && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: log.image_urls[0] }} style={styles.thumbnail} />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  secondaryFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
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
    marginBottom: 8,
  },
  imageContainer: {
    marginTop: 8,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  editButton: {
    paddingVertical: 4,
  },
  editText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
})

// src/features/logs/components/LogEntry.tsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import type { Database } from '@/types/database'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

interface LogEntryProps {
  log: ActivityLog
  unit?: string
  onDelete?: () => void
}

export function LogEntry({ log, unit, onDelete }: LogEntryProps) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{log.value}</Text>
          <Text style={styles.unit}>{unit || 'units'}</Text>
        </View>
        <Text style={styles.date}>{formatDate(log.logged_at)}</Text>
      </View>

      {log.note && (
        <Text style={styles.note}>{truncateNote(log.note)}</Text>
      )}

      {log.image_urls && log.image_urls.length > 0 && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: log.image_urls[0] }} style={styles.thumbnail} />
        </View>
      )}

      {onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
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
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
})

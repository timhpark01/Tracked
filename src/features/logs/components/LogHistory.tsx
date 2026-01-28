// src/features/logs/components/LogHistory.tsx
import { FlatList, View, Text, StyleSheet } from 'react-native'
import type { Database } from '@/types/database'
import { LogEntry } from './LogEntry'

type HobbyLog = Database['public']['Tables']['hobby_logs']['Row']

interface LogHistoryProps {
  logs: HobbyLog[]
  unit?: string
  onDeleteLog: (logId: string) => void
}

export function LogHistory({ logs, unit, onDeleteLog }: LogHistoryProps) {
  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No logs yet</Text>
        <Text style={styles.emptySubtext}>Start tracking your progress!</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <LogEntry
          log={item}
          unit={unit}
          onDelete={() => onDeleteLog(item.id)}
        />
      )}
      contentContainerStyle={styles.listContent}
      scrollEnabled={false}
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
})

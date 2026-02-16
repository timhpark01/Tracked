// src/features/projects/components/ProjectCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectCardProps {
  project: Project
  logCount?: number
  lastLoggedAt?: string | null
  onPress?: () => void
}

export function ProjectCard({ project, logCount, lastLoggedAt, onPress }: ProjectCardProps) {
  const formatLastLogged = (date: string | null | undefined) => {
    if (!date) return null
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString()
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{project.name}</Text>
        {logCount !== undefined && (
          <Text style={styles.logCount}>{logCount} logs</Text>
        )}
      </View>

      {project.description && (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      {lastLoggedAt && (
        <Text style={styles.lastLogged}>
          Last logged: {formatLastLogged(lastLoggedAt)}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  logCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  lastLogged: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
})

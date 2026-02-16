// src/features/projects/components/ProjectList.tsx
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { ProjectCard } from './ProjectCard'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectWithStats extends Project {
  logCount?: number
  lastLoggedAt?: string | null
}

interface ProjectListProps {
  projects: ProjectWithStats[]
  isLoading?: boolean
  onProjectPress?: (project: Project) => void
  emptyMessage?: string
}

export function ProjectList({
  projects,
  isLoading = false,
  onProjectPress,
  emptyMessage = 'No projects yet',
}: ProjectListProps) {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (projects.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          logCount={project.logCount}
          lastLoggedAt={project.lastLoggedAt}
          onPress={() => onProjectPress?.(project)}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
})

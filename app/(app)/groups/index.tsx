// app/(app)/groups/index.tsx
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useGroups, GroupCard } from '@/features/groups'

export default function MyGroupsScreen() {
  const { data: groups, isLoading, error } = useGroups()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading groups: {error.message}</Text>
      </View>
    )
  }

  if (!groups?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No Groups Yet</Text>
        <Text style={styles.emptySubtitle}>
          Join or create a group to see it here
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => router.push(`/groups/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  list: {
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
})

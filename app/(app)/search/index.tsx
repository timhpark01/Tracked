// app/(app)/search/index.tsx
import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { useSearchUsers } from '@/features/social'
import type { Profile } from '@/features/social'

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: users, isLoading, isFetching } = useSearchUsers(debouncedQuery)

  const showLoading = isFetching && debouncedQuery.length >= 2
  const showNoResults =
    debouncedQuery.length >= 2 && !isLoading && users?.length === 0
  const showMinCharsMessage = debouncedQuery.length < 2 && searchQuery.length > 0

  const renderUser = ({ item }: { item: Profile }) => (
    <Pressable
      style={styles.userItem}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {item.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <Text style={styles.username}>@{item.username}</Text>
    </Pressable>
  )

  const renderEmptyState = () => {
    if (showMinCharsMessage) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Type at least 2 characters to search
          </Text>
        </View>
      )
    }

    if (showNoResults) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )
    }

    if (!searchQuery) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Search for users by username</Text>
        </View>
      )
    }

    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {showLoading && (
          <ActivityIndicator
            style={styles.loadingIndicator}
            size="small"
            color="#3b82f6"
          />
        )}
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  username: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
})

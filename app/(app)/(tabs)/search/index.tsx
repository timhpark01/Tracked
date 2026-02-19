// app/(app)/search/index.tsx
import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
  DeviceEventEmitter,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSearchUsers } from '@/features/social'
import { useSearchGroups, GroupCard } from '@/features/groups'
import type { Profile } from '@/features/social'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['groups']['Row']
type SearchTab = 'users' | 'groups'

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<SearchTab>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<TextInput>(null)

  // Listen for focus event from tab press
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('focusSearchInput', () => {
      inputRef.current?.focus()
    })
    return () => subscription.remove()
  }, [])

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const {
    data: users,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useSearchUsers(debouncedQuery)

  const {
    data: groups,
    isLoading: groupsLoading,
    isFetching: groupsFetching,
  } = useSearchGroups(debouncedQuery)

  const isLoading = activeTab === 'users' ? usersLoading : groupsLoading
  const isFetching = activeTab === 'users' ? usersFetching : groupsFetching
  const data = activeTab === 'users' ? users : groups

  const showLoading = isFetching && debouncedQuery.length >= 2
  const showNoResults =
    debouncedQuery.length >= 2 && !isLoading && (data?.length ?? 0) === 0
  const showMinCharsMessage = debouncedQuery.length < 2 && searchQuery.length > 0

  const renderUser = ({ item }: { item: Profile }) => (
    <Pressable
      style={styles.userItem}
      onPress={() => router.push(`/user/${item.id}`)}
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

  const renderGroup = ({ item }: { item: Group }) => (
    <View style={styles.groupCardWrapper}>
      <GroupCard group={item} onPress={() => router.push(`/groups/${item.id}`)} />
    </View>
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
          <Text style={styles.emptyText}>
            No {activeTab === 'users' ? 'users' : 'groups'} found
          </Text>
        </View>
      )
    }

    if (!searchQuery) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Search for {activeTab === 'users' ? 'users by username' : 'groups by name'}
          </Text>
        </View>
      )
    }

    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={`Search ${activeTab === 'users' ? 'users' : 'groups'}...`}
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

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'users' && styles.tabTextActive,
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'groups' && styles.tabTextActive,
            ]}
          >
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'users' ? (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.groupListContent}
        />
      )}

      {activeTab === 'groups' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/groups/new')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  listContent: {
    flexGrow: 1,
  },
  groupListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  groupCardWrapper: {
    marginBottom: 0,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
})

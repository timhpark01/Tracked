// app/(app)/profile/following.tsx
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useFollowing } from '@/features/social'

type FollowingUser = {
  id: string
  username: string | null
  avatar_url: string | null
}

export default function FollowingScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { data: following, isLoading, error } = useFollowing(userId || '')

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
        <Text style={styles.errorText}>
          Error loading following: {error.message}
        </Text>
      </View>
    )
  }

  const renderUser = ({ item: user }: { item: FollowingUser }) => (
    <Pressable
      style={styles.userItem}
      onPress={() => router.push(`/profile/${user.id}`)}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {user.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <Text style={styles.username}>@{user.username || 'anonymous'}</Text>
    </Pressable>
  )

  return (
    <View style={styles.container}>
      {!isLoading && following?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not following anyone yet</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
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
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  username: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
})

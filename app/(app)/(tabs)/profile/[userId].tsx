// app/(app)/profile/[userId].tsx
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useProfile } from '@/features/profiles'
import { useIsFollowing, useFollowUser, useUnfollowUser, useFollowers, useFollowing } from '@/features/social'

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { data: profile, isLoading, error } = useProfile(userId || '')

  // Follow/unfollow functionality
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(userId || '')
  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()
  const isPending = followMutation.isPending || unfollowMutation.isPending

  // Follower/following counts
  const { data: followers } = useFollowers(userId || '')
  const { data: following } = useFollowing(userId || '')

  const handleFollow = () => {
    if (!userId) return
    if (isFollowing) {
      unfollowMutation.mutate({ followingId: userId })
    } else {
      followMutation.mutate({ followingId: userId })
    }
  }

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
          Error loading profile: {error.message}
        </Text>
      </View>
    )
  }

  // User not found
  if (!profile) {
    return (
      <View style={styles.centered}>
        <View style={styles.notFoundIcon}>
          <Text style={styles.notFoundIconText}>?</Text>
        </View>
        <Text style={styles.notFoundTitle}>User Not Found</Text>
        <Text style={styles.notFoundSubtitle}>
          This user doesn't exist or hasn't set up their profile yet
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {profile.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Username */}
      <Text style={styles.username}>@{profile.username}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Pressable
          style={styles.statItem}
          onPress={() => router.push(`/profile/followers?userId=${userId}`)}
        >
          <Text style={styles.statNumber}>{followers?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </Pressable>
        <Pressable
          style={styles.statItem}
          onPress={() => router.push(`/profile/following?userId=${userId}`)}
        >
          <Text style={styles.statNumber}>{following?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </Pressable>
      </View>

      {/* Bio */}
      {profile.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : (
        <Text style={styles.noBio}>No bio</Text>
      )}

      {/* Follow button - only show if not loading */}
      {!checkingFollow && (
        <Pressable
          style={[
            styles.followButton,
            isFollowing && styles.followButtonFollowing,
            isPending && styles.followButtonDisabled,
          ]}
          onPress={handleFollow}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={isFollowing ? '#374151' : '#fff'} />
          ) : (
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followButtonTextFollowing,
            ]}>
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  // Not found state
  notFoundIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  notFoundIconText: {
    fontSize: 32,
    color: '#9ca3af',
    fontWeight: '300',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Profile view
  avatarSection: {
    marginBottom: 16,
    marginTop: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    color: '#6b7280',
    fontWeight: '600',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  noBio: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Follow button
  followButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  followButtonFollowing: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  followButtonDisabled: {
    opacity: 0.7,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonTextFollowing: {
    color: '#374151',
  },
})

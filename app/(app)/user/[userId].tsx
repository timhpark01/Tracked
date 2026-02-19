// app/(app)/user/[userId].tsx
import { useState } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useProfile, ProfileTabs, SkillsTab, FeedTab, ActivitiesTab, type TabKey } from '@/features/profiles'
import { useIsFollowing, useFollowUser, useUnfollowUser, useFollowers, useFollowing } from '@/features/social'
import { useAuth } from '@/features/auth'

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { user: currentUser } = useAuth()
  const { data: profile, isLoading, error } = useProfile(userId || '')
  const [activeTab, setActiveTab] = useState<TabKey>('skills')

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'skills':
        return <SkillsTab userId={userId} />
      case 'feed':
        return <FeedTab userId={userId} />
      case 'activities':
        return <ActivitiesTab userId={userId} isOwnProfile={isOwnProfile} />
    }
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
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

        {/* Username and Stats */}
        <View style={styles.infoSection}>
          <Text style={styles.username}>@{profile.username}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/followers/${userId}`)}
            >
              <Text style={styles.statNumber}>{followers?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/following/${userId}`)}
            >
              <Text style={styles.statNumber}>{following?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </Pressable>
          </View>

          {/* Follow button - only show if not own profile */}
          {!isOwnProfile && !checkingFollow && (
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
        </View>
      </View>

      {/* Bio */}
      {profile.bio && (
        <View style={styles.bioSection}>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      )}

      {/* Tabs */}
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>
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
  // Header
  header: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    gap: 16,
  },
  avatarSection: {},
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    color: '#6b7280',
    fontWeight: '600',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Follow button
  followButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    minWidth: 90,
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
    fontSize: 13,
    fontWeight: '600',
  },
  followButtonTextFollowing: {
    color: '#374151',
  },
  // Bio
  bioSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  // Tab content
  tabContent: {
    flex: 1,
  },
})

// app/(app)/profile/index.tsx
import { useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import {
  useMyProfile,
  ProfileTabs,
  SkillsTab,
  FeedTab,
  ActivitiesTab,
  type TabKey,
} from '@/features/profiles'
import { useFollowers, useFollowing } from '@/features/social'
import { useGroups } from '@/features/groups'
import { useAuth } from '@/features/auth'

export default function ProfileScreen() {
  const { user } = useAuth()
  const { data: profile, isLoading, error } = useMyProfile()
  const [activeTab, setActiveTab] = useState<TabKey>('feed')

  // Follower/following/groups counts
  const { data: followers } = useFollowers(user?.id || '')
  const { data: following } = useFollowing(user?.id || '')
  const { data: groups } = useGroups()

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

  // New user - no profile yet
  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyAvatar}>
            <Text style={styles.emptyAvatarText}>?</Text>
          </View>
          <Text style={styles.emptyTitle}>Complete Your Profile</Text>
          <Text style={styles.emptySubtitle}>
            Add a username and bio to get started
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.primaryButtonText}>Set Up Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'skills':
        return <SkillsTab />
      case 'feed':
        return <FeedTab />
      case 'activities':
        return <ActivitiesTab />
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
              onPress={() => router.push(`/followers/${user?.id}`)}
            >
              <Text style={styles.statNumber}>{followers?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/following/${user?.id}`)}
            >
              <Text style={styles.statNumber}>{following?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push('/groups')}
            >
              <Text style={styles.statNumber}>{groups?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </Pressable>
          </View>

          {/* Edit button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
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
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyAvatarText: {
    fontSize: 36,
    color: '#9ca3af',
    fontWeight: '300',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  editButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
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

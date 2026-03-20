// app/(app)/profile/index.tsx
import { useState, useMemo } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import {
  useMyProfile,
  ProfileTabs,
  SkillsTab,
  FeedTab,
  ActivitiesTab,
  type TabKey,
} from '@/features/profiles'
import { useFollowers, useFollowing } from '@/features/social'
import { useAuth } from '@/features/auth'
import { supabase } from '@/lib/supabase'

export default function ProfileScreen() {
  const { user } = useAuth()
  const { data: profile, isLoading, error } = useMyProfile()
  const [activeTab, setActiveTab] = useState<TabKey>('feed')

  // Follower/following counts
  const { data: followers } = useFollowers(user?.id || '')
  const { data: following } = useFollowing(user?.id || '')

  // Calculate streak (consecutive days with logs)
  const { data: streak } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!logs || logs.length === 0) return 0

      // Get unique dates (in local timezone)
      const uniqueDates = [...new Set(
        logs.map(log => {
          const date = new Date(log.created_at)
          return date.toISOString().split('T')[0]
        })
      )].sort((a, b) => b.localeCompare(a)) // Sort descending

      // Check if today or yesterday has a log (streak must be current)
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0 // Streak broken
      }

      // Count consecutive days
      let streakCount = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1])
        const currDate = new Date(uniqueDates[i])
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000)

        if (diffDays === 1) {
          streakCount++
        } else {
          break
        }
      }

      return streakCount
    },
    enabled: !!user?.id,
  })

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
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
      {/* Profile Header Card */}
      <View style={styles.headerCard}>
        {/* Avatar */}
        <View style={styles.avatarRing}>
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

        {/* Username + Streak */}
        <View style={styles.usernameRow}>
          <Text style={styles.username}>@{profile.username}</Text>
          {(streak ?? 0) > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={13} color="#fff" />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {profile.bio && (
          <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable
            style={styles.statItem}
            onPress={() => router.push(`/followers/${user?.id}`)}
          >
            <Text style={styles.statNumber}>{followers?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable
            style={styles.statItem}
            onPress={() => router.push(`/following/${user?.id}`)}
          >
            <Text style={styles.statNumber}>{following?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </Pressable>
          {(streak ?? 0) > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.streakNumber]}>{streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/profile/edit')}
        >
          <Ionicons name="pencil-outline" size={14} color="#007AFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Header card
  headerCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 2,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    color: '#6b7280',
    fontWeight: '600',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  streakText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bio: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  streakNumber: {
    color: '#f97316',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
  },
  // Edit button
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Tab content
  tabContent: {
    flex: 1,
  },
})

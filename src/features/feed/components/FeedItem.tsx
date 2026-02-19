// src/features/feed/components/FeedItem.tsx
import React, { memo } from 'react'
import { View, Text, Image, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useToggleReaction, type ReactionInfo } from '@/features/reactions'
import type { FeedLog } from '../services/feed.service'

interface FeedItemProps {
  log: FeedLog
  // Optional pre-fetched data from batch queries (for performance)
  reactionInfo?: ReactionInfo
  commentCount?: number
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  // Check if date is today
  const isToday = date.toDateString() === now.toDateString()

  // Check if date is yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  // Format time with timezone
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  // Format date
  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })

  if (isToday) {
    return `Today, ${dateStr} ${timeStr}`
  }

  if (isYesterday) {
    return `Yesterday, ${dateStr} ${timeStr}`
  }

  return `${dateStr} ${timeStr}`
}

function formatValue(value: number): string {
  // Value is in minutes
  if (value >= 60) {
    const hours = Math.floor(value / 60)
    const mins = value % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${value} min`
}

function FeedItemComponent({ log, reactionInfo, commentCount }: FeedItemProps) {
  const { user, activity, project } = log
  const avatarUri = user.avatar_url || undefined
  const displayValue = formatValue(log.value)

  // Reactions mutation
  const toggleReaction = useToggleReaction()

  const handleGudoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleReaction.mutate(log.id)
  }

  const handleCommentPress = () => {
    router.push(`/comments/${log.id}`)
  }

  const handleUserPress = () => {
    router.push(`/user/${user.id}`)
  }

  return (
    <Pressable style={styles.container} onPress={handleCommentPress}>
      {/* User Row */}
      <View style={styles.userRow}>
        <Pressable
          style={styles.avatarContainer}
          onPress={(e) => {
            e.stopPropagation()
            handleUserPress()
          }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {user.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={styles.userInfo}
          onPress={(e) => {
            e.stopPropagation()
            handleUserPress()
          }}
        >
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(log.logged_at)}</Text>
        </Pressable>
      </View>

      {/* Activity: Project & Value */}
      <View style={styles.contentRow}>
        <Text style={styles.activityProject}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.projectName}> - {project.name}</Text>
        </Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>

      {/* Note (if present) */}
      {log.note && (
        <Text style={styles.note} numberOfLines={2}>
          {log.note}
        </Text>
      )}

      {/* Image (if present) */}
      {log.image_urls && log.image_urls.length > 0 && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: log.image_urls[0] }} style={styles.image} />
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <Pressable
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation()
            handleGudoPress()
          }}
          disabled={toggleReaction.isPending}
        >
          <MaterialCommunityIcons
            name="hand-clap"
            size={22}
            color={reactionInfo?.hasReacted ? '#007AFF' : '#6b7280'}
          />
          <Text style={[styles.actionCount, reactionInfo?.hasReacted && styles.actionCountActive]}>
            {reactionInfo?.count ?? 0}
          </Text>
        </Pressable>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.actionCount}>{commentCount ?? 0}</Text>
        </View>
      </View>
    </Pressable>
  )
}

// Custom comparison to prevent re-renders when only reaction/comment counts change slightly
export const FeedItem = memo(FeedItemComponent, (prevProps, nextProps) => {
  // Always re-render if the log itself changed
  if (prevProps.log.id !== nextProps.log.id) return false
  if (prevProps.log.note !== nextProps.log.note) return false
  if (prevProps.log.value !== nextProps.log.value) return false

  // Re-render if reaction state changed
  if (prevProps.reactionInfo?.hasReacted !== nextProps.reactionInfo?.hasReacted) return false
  if (prevProps.reactionInfo?.count !== nextProps.reactionInfo?.count) return false

  // Re-render if comment count changed
  if (prevProps.commentCount !== nextProps.commentCount) return false

  return true
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityProject: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  activityName: {
    fontWeight: '700',
    color: '#111827',
  },
  projectName: {
    fontWeight: '400',
    color: '#374151',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  note: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  imageContainer: {
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionBar: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionCountActive: {
    color: '#007AFF',
  },
})

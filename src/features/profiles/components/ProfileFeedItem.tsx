// src/features/profiles/components/ProfileFeedItem.tsx
import React, { memo } from 'react'
import { View, Text, Image, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useToggleReaction, type ReactionInfo } from '@/features/reactions'
import type { FeedLog } from '@/features/feed'

interface ProfileFeedItemProps {
  log: FeedLog
  reactionInfo?: ReactionInfo
  commentCount?: number
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })

  if (isToday) {
    return `Today at ${timeStr}`
  }

  if (isYesterday) {
    return `Yesterday at ${timeStr}`
  }

  return `${dateStr} at ${timeStr}`
}

function formatValue(value: number): string {
  if (value >= 60) {
    const hours = Math.floor(value / 60)
    const mins = value % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${value} min`
}

function ProfileFeedItemComponent({ log, reactionInfo, commentCount }: ProfileFeedItemProps) {
  const { activity, project } = log
  const displayValue = formatValue(log.value)

  const toggleReaction = useToggleReaction()

  const handleReactionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleReaction.mutate(log.id)
  }

  const handlePress = () => {
    router.push(`/comments/${log.id}`)
  }

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Timeline elements */}
      <View style={styles.timeline}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Date */}
        <Text style={styles.date}>{formatRelativeTime(log.logged_at)}</Text>

        {/* Activity & Project row */}
        <View style={styles.activityRow}>
          <Text style={styles.activityProject}>
            <Text style={styles.activityName}>{activity.name}</Text>
            {project.name !== 'General' && (
              <Text style={styles.projectName}> - {project.name}</Text>
            )}
          </Text>
          <Text style={styles.value}>{displayValue}</Text>
        </View>

        {/* Note */}
        {log.note && (
          <Text style={styles.note} numberOfLines={3}>
            {log.note}
          </Text>
        )}

        {/* Image */}
        {log.image_urls && log.image_urls.length > 0 && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: log.image_urls[0] }} style={styles.image} />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation()
              handleReactionPress()
            }}
            disabled={toggleReaction.isPending}
          >
            <MaterialCommunityIcons
              name="hand-clap"
              size={18}
              color={reactionInfo?.hasReacted ? '#007AFF' : '#9ca3af'}
            />
            <Text style={[styles.actionCount, reactionInfo?.hasReacted && styles.actionCountActive]}>
              {reactionInfo?.count ?? 0}
            </Text>
          </Pressable>

          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={16} color="#9ca3af" />
            <Text style={styles.actionCount}>{commentCount ?? 0}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export const ProfileFeedItem = memo(ProfileFeedItemComponent, (prevProps, nextProps) => {
  if (prevProps.log.id !== nextProps.log.id) return false
  if (prevProps.log.note !== nextProps.log.note) return false
  if (prevProps.log.value !== nextProps.log.value) return false
  if (prevProps.reactionInfo?.hasReacted !== nextProps.reactionInfo?.hasReacted) return false
  if (prevProps.reactionInfo?.count !== nextProps.reactionInfo?.count) return false
  if (prevProps.commentCount !== nextProps.commentCount) return false
  return true
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  timeline: {
    width: 32,
    alignItems: 'center',
    paddingLeft: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
    paddingLeft: 12,
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityProject: {
    flex: 1,
    fontSize: 15,
  },
  activityName: {
    fontWeight: '600',
    color: '#111827',
  },
  projectName: {
    fontWeight: '400',
    color: '#6b7280',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  note: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 4,
  },
  imageContainer: {
    marginTop: 10,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  actionCountActive: {
    color: '#007AFF',
  },
})

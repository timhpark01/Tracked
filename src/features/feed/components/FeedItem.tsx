// src/features/feed/components/FeedItem.tsx
import React, { memo } from 'react'
import { View, Text, Image, StyleSheet, Pressable, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { MediaCarousel } from '@/components/MediaCarousel'
import { useToggleReaction, type ReactionInfo } from '@/features/reactions'
import type { FeedLog } from '../services/feed.service'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface FeedItemProps {
  log: FeedLog
  reactionInfo?: ReactionInfo
  commentCount?: number
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatValue(value: number): string {
  if (value >= 60) {
    const hours = Math.floor(value / 60)
    const mins = value % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${value}m`
}

// Derive a consistent accent color from the activity name if no project color
function getAccentColor(log: FeedLog): string {
  const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#FF6B6B', '#4ECDC4']
  const hash = (log.activity?.name ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function FeedItemComponent({ log, reactionInfo, commentCount }: FeedItemProps) {
  const { user, activity, project } = log
  const avatarUri = user.avatar_url || undefined
  const displayValue = formatValue(log.value)
  const accentColor = getAccentColor(log)
  const hasReacted = reactionInfo?.hasReacted ?? false

  const toggleReaction = useToggleReaction()

  // Clap button spring animation
  const clapScale = useSharedValue(1)
  const clapAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clapScale.value }],
  }))

  const handleGudoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    clapScale.value = withSpring(1.3, { damping: 6, stiffness: 300 }, () => {
      clapScale.value = withSpring(1, { damping: 8, stiffness: 200 })
    })
    toggleReaction.mutate(log.id)
  }

  const handleCommentPress = () => router.push(`/comments/${log.id}`)
  const handleUserPress = () => router.push(`/user/${user.id}`)

  return (
    <View style={styles.card}>
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.cardContent}>
        {/* User Row */}
        <View style={styles.userRow}>
          <Pressable onPress={handleUserPress}>
            <View style={[styles.avatarRing, { borderColor: accentColor }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: accentColor + '22' }]}>
                  <Text style={[styles.avatarFallbackText, { color: accentColor }]}>
                    {user.username?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          <Pressable style={styles.userInfo} onPress={handleUserPress}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.timestamp}>{formatRelativeTime(log.logged_at)}</Text>
          </Pressable>

          {/* Hero value badge */}
          <View style={[styles.valueBadge, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.valueBadgeText, { color: accentColor }]}>{displayValue}</Text>
          </View>
        </View>

        {/* Activity label */}
        <Pressable onPress={handleCommentPress}>
          <View style={styles.activityRow}>
            <Text style={styles.activityName}>{activity.name}</Text>
            {project.name !== 'General' && (
              <View style={[styles.projectPill, { backgroundColor: accentColor + '18' }]}>
                <Text style={[styles.projectPillText, { color: accentColor }]}>{project.name}</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Media */}
        {log.image_urls && log.image_urls.length > 0 && (
          <View style={styles.mediaContainer}>
            <MediaCarousel urls={log.image_urls} width={SCREEN_WIDTH - 48} height={220} />
          </View>
        )}

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <Animated.View style={clapAnimStyle}>
            <Pressable
              style={styles.actionButton}
              onPress={handleGudoPress}
              disabled={toggleReaction.isPending}
            >
              <MaterialCommunityIcons
                name={hasReacted ? 'hand-clap' : 'hand-clap'}
                size={20}
                color={hasReacted ? accentColor : '#9ca3af'}
              />
              <Text style={[styles.actionCount, hasReacted && { color: accentColor }]}>
                {reactionInfo?.count ?? 0}
              </Text>
            </Pressable>
          </Animated.View>

          <Pressable style={styles.actionButton} onPress={handleCommentPress}>
            <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
            <Text style={styles.actionCount}>{commentCount ?? 0}</Text>
          </Pressable>
        </View>

        {/* Caption */}
        {log.note && (
          <Pressable onPress={handleCommentPress} style={styles.captionContainer}>
            <Text style={styles.caption} numberOfLines={2}>
              <Text style={styles.captionUsername}>{user.username}</Text>
              {'  '}{log.note}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

export const FeedItem = memo(FeedItemComponent, (prevProps, nextProps) => {
  if (prevProps.log.id !== nextProps.log.id) return false
  if (prevProps.log.note !== nextProps.log.note) return false
  if (prevProps.log.value !== nextProps.log.value) return false
  if (prevProps.reactionInfo?.hasReacted !== nextProps.reactionInfo?.hasReacted) return false
  if (prevProps.reactionInfo?.count !== nextProps.reactionInfo?.count) return false
  if (prevProps.commentCount !== nextProps.commentCount) return false
  return true
})

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderRadius: 0,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 17,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  valueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  valueBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  projectPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  projectPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mediaContainer: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionBar: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  captionContainer: {
    marginTop: 8,
  },
  caption: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
    color: '#111827',
  },
})

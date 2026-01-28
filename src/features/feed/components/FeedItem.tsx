// src/features/feed/components/FeedItem.tsx
import React, { memo } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import type { FeedLog } from '../services/feed.service'

interface FeedItemProps {
  log: FeedLog
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatValue(value: number, trackingType: 'time' | 'quantity', unit: string | null): string {
  if (trackingType === 'time') {
    // Value is in minutes for time tracking
    if (value >= 60) {
      const hours = Math.floor(value / 60)
      const mins = value % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${value} min`
  }
  return `${value} ${unit || 'units'}`
}

function FeedItemComponent({ log }: FeedItemProps) {
  const { user, hobby } = log
  const avatarUri = user.avatar_url || undefined
  const displayValue = formatValue(log.value, hobby.tracking_type, hobby.goal_unit)

  return (
    <View style={styles.container}>
      {/* User Row */}
      <View style={styles.userRow}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {user.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(log.logged_at)}</Text>
        </View>
      </View>

      {/* Hobby & Value */}
      <View style={styles.contentRow}>
        <Text style={styles.hobbyName}>{hobby.name}</Text>
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
    </View>
  )
}

export const FeedItem = memo(FeedItemComponent)

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
  hobbyName: {
    fontSize: 16,
    fontWeight: '500',
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
})

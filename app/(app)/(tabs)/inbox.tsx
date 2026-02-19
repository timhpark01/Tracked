import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from '@/features/notifications'

type Section = {
  title: string
  data: Notification[]
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupNotificationsByDate(notifications: Notification[]): Section[] {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups: Record<string, Notification[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  }

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at)
    if (date.toDateString() === today.toDateString()) {
      groups['Today'].push(notification)
    } else if (date.toDateString() === yesterday.toDateString()) {
      groups['Yesterday'].push(notification)
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      groups['This Week'].push(notification)
    } else {
      groups['Earlier'].push(notification)
    }
  })

  return Object.entries(groups)
    .filter(([_, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }))
}

function getNotificationIcon(type: Notification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'like':
      return 'heart'
    case 'comment':
      return 'chatbubble'
    case 'follow':
      return 'person-add'
    case 'mention':
      return 'at'
    default:
      return 'notifications'
  }
}

function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'like':
      return '#ef4444'
    case 'comment':
      return '#3b82f6'
    case 'follow':
      return '#10b981'
    case 'mention':
      return '#8b5cf6'
    default:
      return '#007AFF'
  }
}

export default function InboxScreen() {
  const insets = useSafeAreaInsets()
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const allNotifications = data?.pages.flatMap((page) => page) ?? []
  const sections = groupNotificationsByDate(allNotifications)
  const hasUnread = allNotifications.some((n) => !n.read)

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead.mutate(notification.id)
    }

    // Navigate based on type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
        if (notification.activity_log_id) {
          router.push(`/comments/${notification.activity_log_id}`)
        }
        break
      case 'follow':
        router.push(`/user/${notification.actor_id}`)
        break
    }
  }

  const handleMarkAllRead = () => {
    markAllAsRead.mutate()
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const renderItem = ({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.type)
    const iconColor = getNotificationColor(item.type)

    return (
      <Pressable
        style={[styles.item, !item.read && styles.unread]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Actor Avatar */}
        <View style={styles.avatarContainer}>
          {item.actor.avatar_url ? (
            <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {item.actor.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* Type indicator badge */}
          <View style={[styles.typeBadge, { backgroundColor: iconColor }]}>
            <Ionicons name={iconName} size={10} color="#fff" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.itemContent}>
          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.itemTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>

        {/* Unread dot */}
        {!item.read && <View style={styles.unreadDot} />}
      </Pressable>
    )
  }

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  )

  const renderFooter = () => {
    if (!isFetchingNextPage) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySubtitle}>
          When someone likes, comments, or follows you, you'll see it here
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Mark All Read Button */}
      {hasUnread && (
        <Pressable
          style={styles.markAllButton}
          onPress={handleMarkAllRead}
          disabled={markAllAsRead.isPending}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </Pressable>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
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
  },
  list: {
    paddingBottom: 24,
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  markAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'right',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  unread: {
    backgroundColor: '#eff6ff',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  itemContent: {
    flex: 1,
  },
  itemBody: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
})

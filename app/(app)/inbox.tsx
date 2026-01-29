import { View, Text, StyleSheet, SectionList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type InboxItem = {
  id: string
  type: 'notification' | 'comment' | 'like' | 'message'
  title: string
  subtitle: string
  time: string
  read: boolean
}

type Section = {
  title: string
  data: InboxItem[]
}

// Placeholder data - will be replaced with real data later
const sections: Section[] = []

export default function InboxScreen() {
  const renderItem = ({ item }: { item: InboxItem }) => {
    const iconName = {
      notification: 'notifications-outline',
      comment: 'chatbubble-outline',
      like: 'heart-outline',
      message: 'mail-outline',
    }[item.type] as keyof typeof Ionicons.glyphMap

    return (
      <View style={[styles.item, !item.read && styles.unread]}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color="#007AFF" />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        </View>
        <Text style={styles.itemTime}>{item.time}</Text>
      </View>
    )
  }

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  )

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="mail-open-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySubtitle}>
          When you get notifications, comments, likes, or messages, they'll show up here
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemTime: {
    fontSize: 12,
    color: '#9ca3af',
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

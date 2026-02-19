// src/features/groups/components/GroupCard.tsx
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['groups']['Row']

interface GroupCardProps {
  group: Group
  onPress?: () => void
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const getMembershipIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (group.membership_type) {
      case 'open':
        return 'globe-outline'
      case 'request':
        return 'hand-right-outline'
      case 'invite':
        return 'lock-closed-outline'
    }
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {group.avatar_url ? (
        <Image source={{ uri: group.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="people" size={24} color="#6b7280" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{group.name}</Text>
        {group.description && (
          <Text style={styles.description} numberOfLines={2}>
            {group.description}
          </Text>
        )}
        <View style={styles.meta}>
          <Ionicons name={getMembershipIcon()} size={14} color="#9ca3af" />
          <Text style={styles.memberCount}>
            {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
})

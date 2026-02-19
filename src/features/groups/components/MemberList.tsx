// src/features/groups/components/MemberList.tsx
import { View, Text, FlatList, Image, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import type { GroupMemberWithProfile } from '../services/membership.service'

interface MemberListProps {
  members: GroupMemberWithProfile[]
  isLoading?: boolean
}

export function MemberList({ members, isLoading }: MemberListProps) {
  const renderMember = ({ item }: { item: GroupMemberWithProfile }) => (
    <Pressable
      style={styles.memberItem}
      onPress={() => router.push(`/user/${item.user_id}`)}
    >
      {item.profile.avatar_url ? (
        <Image
          source={{ uri: item.profile.avatar_url }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {item.profile.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.username}>@{item.profile.username}</Text>
        {item.profile.bio && (
          <Text style={styles.bio} numberOfLines={1}>
            {item.profile.bio}
          </Text>
        )}
      </View>
      {item.role !== 'member' && (
        <View
          style={[
            styles.roleBadge,
            item.role === 'admin' && styles.adminBadge,
            item.role === 'moderator' && styles.modBadge,
          ]}
        >
          <Text style={styles.roleText}>
            {item.role === 'admin' ? 'Admin' : 'Mod'}
          </Text>
        </View>
      )}
    </Pressable>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={members}
      renderItem={renderMember}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No members yet</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  bio: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadge: {
    backgroundColor: '#dbeafe',
  },
  modBadge: {
    backgroundColor: '#fef3c7',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
})

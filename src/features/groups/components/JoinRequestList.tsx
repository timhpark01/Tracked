// src/features/groups/components/JoinRequestList.tsx
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRespondToRequest } from '../hooks/useRespondToRequest'
import type { JoinRequestWithProfile } from '../services/membership.service'

interface JoinRequestListProps {
  requests: JoinRequestWithProfile[]
  groupId: string
  isLoading?: boolean
}

export function JoinRequestList({
  requests,
  groupId,
  isLoading,
}: JoinRequestListProps) {
  const respondMutation = useRespondToRequest()

  const handleApprove = (requestId: string) => {
    respondMutation.mutate({ requestId, status: 'approved', groupId })
  }

  const handleReject = (requestId: string) => {
    respondMutation.mutate({ requestId, status: 'rejected', groupId })
  }

  const renderRequest = ({ item }: { item: JoinRequestWithProfile }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
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
        <View style={styles.textInfo}>
          <Text style={styles.username}>@{item.profile.username}</Text>
          {item.message && (
            <Text style={styles.message} numberOfLines={2}>
              "{item.message}"
            </Text>
          )}
          <Text style={styles.timestamp}>
            {new Date(item.requested_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
          disabled={respondMutation.isPending}
        >
          {respondMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
          disabled={respondMutation.isPending}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={requests}
      renderItem={renderRequest}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  textInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
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
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
})

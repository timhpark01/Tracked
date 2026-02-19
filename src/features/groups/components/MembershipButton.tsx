// src/features/groups/components/MembershipButton.tsx
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useGroupMembership, type MembershipStatus } from '../hooks/useGroupMembership'
import { useHasPendingRequest } from '../hooks/useHasPendingRequest'
import { useJoinGroup } from '../hooks/useJoinGroup'
import { useLeaveGroup } from '../hooks/useLeaveGroup'
import { useRequestJoin } from '../hooks/useRequestJoin'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['groups']['Row']

interface MembershipButtonProps {
  group: Group
  /** Pass pre-fetched membership to avoid duplicate query */
  membership?: MembershipStatus | null
  isLoadingMembership?: boolean
}

export function MembershipButton({ group, membership: prefetchedMembership, isLoadingMembership }: MembershipButtonProps) {
  // Only fetch if not provided
  const { data: fetchedMembership, isLoading: fetchingMembership } = useGroupMembership(
    prefetchedMembership !== undefined ? '' : group.id // Skip fetch if prefetched
  )

  const membership = prefetchedMembership ?? fetchedMembership
  const isLoading = isLoadingMembership ?? fetchingMembership

  // Only check pending request for request-type groups where user is not a member
  const shouldCheckPending = group.membership_type === 'request' && !membership?.isMember
  const { data: hasPendingRequest, isLoading: pendingLoading } = useHasPendingRequest(
    group.id,
    shouldCheckPending
  )

  const joinMutation = useJoinGroup()
  const leaveMutation = useLeaveGroup()
  const requestMutation = useRequestJoin()

  if (isLoading || (shouldCheckPending && pendingLoading)) {
    return (
      <TouchableOpacity style={[styles.button, styles.loading]} disabled>
        <ActivityIndicator size="small" color="#6b7280" />
      </TouchableOpacity>
    )
  }

  // Already a member - show leave button or admin badge
  if (membership?.isMember) {
    if (membership.role === 'admin') {
      return (
        <TouchableOpacity style={[styles.button, styles.admin]} disabled>
          <Text style={styles.adminText}>Admin</Text>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        style={[styles.button, styles.leave]}
        onPress={() => leaveMutation.mutate({ groupId: group.id })}
        disabled={leaveMutation.isPending}
      >
        <Text style={styles.leaveText}>
          {leaveMutation.isPending ? 'Leaving...' : 'Leave'}
        </Text>
      </TouchableOpacity>
    )
  }

  // Pending request (for request-type groups)
  if (hasPendingRequest) {
    return (
      <TouchableOpacity style={[styles.button, styles.pending]} disabled>
        <Text style={styles.pendingText}>Pending</Text>
      </TouchableOpacity>
    )
  }

  // Not a member - show appropriate join action
  if (group.membership_type === 'open') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.join]}
        onPress={() => joinMutation.mutate({ groupId: group.id })}
        disabled={joinMutation.isPending}
      >
        <Text style={styles.joinText}>
          {joinMutation.isPending ? 'Joining...' : 'Join'}
        </Text>
      </TouchableOpacity>
    )
  }

  if (group.membership_type === 'request') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.request]}
        onPress={() => requestMutation.mutate({ groupId: group.id })}
        disabled={requestMutation.isPending}
      >
        <Text style={styles.requestText}>
          {requestMutation.isPending ? 'Requesting...' : 'Request'}
        </Text>
      </TouchableOpacity>
    )
  }

  // Invite-only - no action available
  return (
    <TouchableOpacity style={[styles.button, styles.inviteOnly]} disabled>
      <Text style={styles.inviteOnlyText}>Invite Only</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  loading: {
    backgroundColor: '#f3f4f6',
  },
  join: {
    backgroundColor: '#007AFF',
  },
  joinText: {
    color: '#fff',
    fontWeight: '600',
  },
  leave: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  leaveText: {
    color: '#374151',
    fontWeight: '500',
  },
  request: {
    backgroundColor: '#007AFF',
  },
  requestText: {
    color: '#fff',
    fontWeight: '600',
  },
  pending: {
    backgroundColor: '#fef3c7',
  },
  pendingText: {
    color: '#92400e',
    fontWeight: '500',
  },
  admin: {
    backgroundColor: '#dbeafe',
  },
  adminText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  inviteOnly: {
    backgroundColor: '#f3f4f6',
  },
  inviteOnlyText: {
    color: '#9ca3af',
    fontWeight: '500',
  },
})

// src/features/groups/index.ts

// Services - export specific types to avoid collision
export {
  getGroup,
  getUserGroups,
  searchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  type Group,
  type GroupInsert,
  type GroupUpdate,
  type GroupWithCreator,
} from './services/groups.service'

export {
  getGroupMembers,
  checkMembership,
  joinGroup,
  leaveGroup,
  requestToJoin,
  getPendingRequests,
  checkPendingRequest,
  respondToRequest,
  inviteToGroup,
  getUserInvites,
  respondToInvite,
  type GroupMember,
  type GroupMemberWithProfile,
  type JoinRequest,
  type JoinRequestWithProfile,
  type GroupInvite,
  type GroupInviteWithGroup,
} from './services/membership.service'

// Hooks
export { useGroup } from './hooks/useGroup'
export { useGroups } from './hooks/useGroups'
export { useGroupMembers } from './hooks/useGroupMembers'
export { useSearchGroups } from './hooks/useSearchGroups'
export { useCreateGroup } from './hooks/useCreateGroup'
export { useJoinGroup } from './hooks/useJoinGroup'
export { useLeaveGroup } from './hooks/useLeaveGroup'
export { useGroupMembership, type MembershipStatus } from './hooks/useGroupMembership'
export { useHasPendingRequest } from './hooks/useHasPendingRequest'
export { useRequestJoin } from './hooks/useRequestJoin'
export { useRespondToRequest } from './hooks/useRespondToRequest'
export { useInviteToGroup } from './hooks/useInviteToGroup'
export { usePendingRequests } from './hooks/usePendingRequests'

// Components
export { GroupCard } from './components/GroupCard'
export { GroupForm } from './components/GroupForm'
export { MemberList } from './components/MemberList'
export { MembershipButton } from './components/MembershipButton'
export { JoinRequestList } from './components/JoinRequestList'

// src/features/groups/hooks/useGroupMembership.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { checkMembership } from '../services/membership.service'

export type MembershipStatus = {
  isMember: boolean
  role: 'admin' | 'moderator' | 'member' | null
  hasPendingRequest: boolean
}

/**
 * Hook to check the current user's membership status in a group
 * Optimized to only check membership (pending request checked lazily)
 */
export function useGroupMembership(groupId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['groupMembership', groupId, user?.id],
    queryFn: async (): Promise<MembershipStatus> => {
      // Only check membership - much faster single query
      const membership = await checkMembership(groupId, user!.id)

      return {
        isMember: !!membership,
        role: membership?.role ?? null,
        // Default to false - can be checked separately if needed for request-type groups
        hasPendingRequest: false,
      }
    },
    enabled: !!user && !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

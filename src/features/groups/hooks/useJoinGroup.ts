// src/features/groups/hooks/useJoinGroup.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { joinGroup } from '../services/membership.service'

/**
 * Hook to join an open group
 */
export function useJoinGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) =>
      joinGroup(groupId, user!.id),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
      queryClient.invalidateQueries({
        queryKey: ['groupMembership', groupId, user?.id],
      })
    },
  })
}

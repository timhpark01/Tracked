// src/features/groups/hooks/useCreateGroup.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { createGroup } from '../services/groups.service'
import type { Database } from '@/types/database'

type GroupInsert = Database['public']['Tables']['groups']['Insert']

/**
 * Hook to create a new group
 */
export function useCreateGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<GroupInsert, 'creator_id'>) =>
      createGroup({ ...data, creator_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', user?.id] })
    },
  })
}

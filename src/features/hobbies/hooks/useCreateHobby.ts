// src/features/hobbies/hooks/useCreateHobby.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createHobby } from '../services/hobbies.service'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']
type HobbyInsert = Database['public']['Tables']['hobbies']['Insert']

export function useCreateHobby() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createHobby,
    onMutate: async (newHobby: HobbyInsert) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['hobbies', user?.id] })

      // Snapshot the previous value
      const previousHobbies = queryClient.getQueryData<Hobby[]>(['hobbies', user?.id])

      // Optimistically update to the new value
      const optimisticHobby: Hobby = {
        id: `temp-${Date.now()}`,
        user_id: newHobby.user_id,
        name: newHobby.name,
        tracking_type: newHobby.tracking_type,
        description: newHobby.description ?? null,
        category: newHobby.category ?? null,
        goal_total: newHobby.goal_total ?? null,
        goal_unit: newHobby.goal_unit ?? null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Hobby[]>(
        ['hobbies', user?.id],
        (old = []) => [optimisticHobby, ...old]
      )

      // Return context with snapshot
      return { previousHobbies }
    },
    onError: (_err, _newHobby, context) => {
      // Rollback to previous value on error
      if (context?.previousHobbies) {
        queryClient.setQueryData(['hobbies', user?.id], context.previousHobbies)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['hobbies', user?.id] })
    },
  })
}

// src/features/hobbies/hooks/useDeleteHobby.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteHobby } from '../services/hobbies.service'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']

export function useDeleteHobby() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteHobby,
    onMutate: async (hobbyId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['hobbies', user?.id] })
      await queryClient.cancelQueries({ queryKey: ['hobby', hobbyId] })

      // Snapshot previous values
      const previousHobbies = queryClient.getQueryData<Hobby[]>(['hobbies', user?.id])
      const previousHobby = queryClient.getQueryData<Hobby>(['hobby', hobbyId])

      // Optimistically remove from hobbies list
      queryClient.setQueryData<Hobby[]>(
        ['hobbies', user?.id],
        (old = []) => old.filter((hobby) => hobby.id !== hobbyId)
      )

      // Remove from single hobby cache
      queryClient.removeQueries({ queryKey: ['hobby', hobbyId] })

      return { previousHobbies, previousHobby, hobbyId }
    },
    onError: (_err, hobbyId, context) => {
      // Rollback to previous values on error
      if (context?.previousHobbies) {
        queryClient.setQueryData(['hobbies', user?.id], context.previousHobbies)
      }
      if (context?.previousHobby) {
        queryClient.setQueryData(['hobby', hobbyId], context.previousHobby)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['hobbies', user?.id] })
    },
  })
}

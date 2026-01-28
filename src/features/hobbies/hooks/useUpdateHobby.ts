// src/features/hobbies/hooks/useUpdateHobby.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateHobby } from '../services/hobbies.service'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']
type HobbyUpdate = Database['public']['Tables']['hobbies']['Update']

interface UpdateHobbyInput {
  hobbyId: string
  updates: HobbyUpdate
}

export function useUpdateHobby() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ hobbyId, updates }: UpdateHobbyInput) =>
      updateHobby(hobbyId, updates),
    onMutate: async ({ hobbyId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['hobbies', user?.id] })
      await queryClient.cancelQueries({ queryKey: ['hobby', hobbyId] })

      // Snapshot previous values
      const previousHobbies = queryClient.getQueryData<Hobby[]>(['hobbies', user?.id])
      const previousHobby = queryClient.getQueryData<Hobby>(['hobby', hobbyId])

      // Optimistically update hobbies list
      queryClient.setQueryData<Hobby[]>(
        ['hobbies', user?.id],
        (old = []) =>
          old.map((hobby) =>
            hobby.id === hobbyId ? { ...hobby, ...updates } : hobby
          )
      )

      // Optimistically update single hobby
      if (previousHobby) {
        queryClient.setQueryData<Hobby>(['hobby', hobbyId], {
          ...previousHobby,
          ...updates,
        })
      }

      return { previousHobbies, previousHobby }
    },
    onError: (_err, { hobbyId }, context) => {
      // Rollback to previous values on error
      if (context?.previousHobbies) {
        queryClient.setQueryData(['hobbies', user?.id], context.previousHobbies)
      }
      if (context?.previousHobby) {
        queryClient.setQueryData(['hobby', hobbyId], context.previousHobby)
      }
    },
    onSettled: (_data, _err, { hobbyId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['hobbies', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['hobby', hobbyId] })
    },
  })
}

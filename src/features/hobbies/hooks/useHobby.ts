// src/features/hobbies/hooks/useHobby.ts
import { useQuery } from '@tanstack/react-query'
import { getHobby } from '../services/hobbies.service'

export function useHobby(hobbyId: string) {
  return useQuery({
    queryKey: ['hobby', hobbyId],
    queryFn: () => getHobby(hobbyId),
    enabled: !!hobbyId,
  })
}

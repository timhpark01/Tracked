// src/features/hobbies/hooks/useHobbies.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getHobbies } from '../services/hobbies.service'

export function useHobbies() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['hobbies', user?.id],
    queryFn: () => getHobbies(user!.id),
    enabled: !!user,
  })
}

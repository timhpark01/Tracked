// src/features/activities/hooks/useActivities.ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getActivities } from '../services/activities.service'

export function useActivities() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => getActivities(user!.id),
    enabled: !!user,
  })
}

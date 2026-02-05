// src/features/activities/hooks/useActivity.ts
import { useQuery } from '@tanstack/react-query'
import { getActivity } from '../services/activities.service'

export function useActivity(activityId: string) {
  return useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => getActivity(activityId),
    enabled: !!activityId,
  })
}

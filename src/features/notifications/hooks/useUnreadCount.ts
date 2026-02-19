import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '../services/notifications.service'
import { useAuth } from '@/features/auth'

export function useUnreadCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: () => getUnreadCount(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

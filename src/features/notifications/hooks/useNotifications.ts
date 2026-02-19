import { useInfiniteQuery } from '@tanstack/react-query'
import { getNotifications } from '../services/notifications.service'
import { useAuth } from '@/features/auth'

const PAGE_SIZE = 20

export function useNotifications() {
  const { user } = useAuth()

  return useInfiniteQuery({
    queryKey: ['notifications', user?.id],
    queryFn: ({ pageParam = 0 }) => {
      const start = pageParam * PAGE_SIZE
      const end = start + PAGE_SIZE - 1
      return getNotifications(user!.id, start, end)
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return allPages.length
    },
    initialPageParam: 0,
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

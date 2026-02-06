// src/features/feed/hooks/useFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { getFeedLogs, getPublicFeedLogs, type FeedType } from '../services/feed.service'

const PAGE_SIZE = 20

/**
 * Hook for paginated activity feed using infinite scroll
 * @param feedType - 'public' for all users, 'following' for followed users only
 */
export function useFeed(feedType: FeedType = 'following') {
  const { user, loading: authLoading } = useAuth()

  console.log('[Feed] useFeed called, authLoading:', authLoading, 'userId:', user?.id?.slice(0, 8) ?? 'null')

  return useInfiniteQuery({
    queryKey: ['feed', feedType, user?.id ?? 'anonymous'],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('[Feed] Fetching page', pageParam, 'for', feedType)
      const start = pageParam * PAGE_SIZE
      const end = start + PAGE_SIZE - 1

      if (feedType === 'public') {
        const result = await getPublicFeedLogs(start, end)
        console.log('[Feed] Got', result.length, 'public items')
        return result
      }
      // getFeedLogs handles the case when user is not authenticated
      const result = await getFeedLogs(start, end)
      console.log('[Feed] Got', result.length, 'following items')
      return result
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // No more pages if last page returned fewer items than PAGE_SIZE
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPageParam + 1
    },
    // Wait for auth to finish loading before fetching
    // This prevents fetching with stale/no auth state
    enabled: !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes (feeds change frequently)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

// src/features/feed/hooks/useFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeedLogs } from '../services/feed.service'

const PAGE_SIZE = 20

/**
 * Hook for paginated activity feed using infinite scroll
 * Fetches logs from followed users with RLS enforcement
 */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const start = pageParam * PAGE_SIZE
      const end = start + PAGE_SIZE - 1
      return getFeedLogs(start, end)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // No more pages if last page returned fewer items than PAGE_SIZE
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPageParam + 1
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (feeds change frequently)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (mobile-optimized)
  })
}

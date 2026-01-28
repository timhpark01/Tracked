# Phase 4: Activity Feed - Research

**Researched:** 2026-01-28
**Domain:** React Native infinite scroll feed with Supabase, TanStack Query pagination
**Confidence:** HIGH

## Summary

The activity feed requires combining three key technologies already in the codebase: TanStack Query's `useInfiniteQuery` for pagination, React Native's `FlatList` for performant list rendering, and Supabase's `range()` method for paginated data fetching. The existing RLS policy "Followers can view logs" (line 232 in schema) already enforces the privacy requirement.

Research shows that cursor-based pagination is superior to offset-based for feeds, but Supabase's `range()` method (offset-based) is acceptable for this use case with proper indexing. The key architectural challenge is preventing duplicate loads during infinite scroll, which requires careful state management with `onEndReached` callbacks and TanStack Query's `isFetchingNextPage` flag.

The codebase already follows best practices: feature-based organization, 24-hour gcTime with 5-minute staleTime, and RLS-first security. The activity feed extends existing patterns from `src/features/social/` and `src/features/logs/` without introducing new dependencies.

**Primary recommendation:** Use `useInfiniteQuery` with Supabase `range()` pagination, FlatList with memoized `renderItem`, and rely on existing RLS policies for privacy enforcement.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.90.20 | Infinite scroll pagination | Industry standard for data fetching, built-in `useInfiniteQuery` handles page state |
| react-native | 0.81.5 | FlatList component | Native list virtualization, optimized for long feeds |
| @supabase/supabase-js | ^2.93.2 | Backend queries with RLS | Auto-enforces row-level security, joins work seamlessly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-image | (Expo 54) | Optimized image rendering | Better caching than RN Image, automatic lazy loading |
| @react-native-community/netinfo | ^11.4.1 | Already configured | Network status for pagination retry logic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Query | SWR, Apollo | TanStack already in codebase, proven mobile performance |
| FlatList | @shopify/flash-list | FlashList faster but adds dependency, FlatList sufficient with proper optimization |
| Offset pagination | Cursor-based | Cursor better for large feeds, offset acceptable with indexes on `logged_at` |

**Installation:**
No new packages needed - all dependencies already in package.json.

## Architecture Patterns

### Recommended Project Structure
```
src/features/feed/
├── services/
│   └── feed.service.ts      # getFeedLogs(page, pageSize) -> paginated logs
├── hooks/
│   ├── useFeed.ts            # useInfiniteQuery wrapper
│   └── useFeedInvalidation.ts # Invalidate on new log creation
├── components/
│   ├── FeedList.tsx          # FlatList with infinite scroll
│   ├── FeedItem.tsx          # Memoized feed entry component
│   └── FeedEmpty.tsx         # Empty state (no followed users)
└── index.ts                  # Public exports
```

### Pattern 1: Infinite Query with Range-Based Pagination
**What:** Use TanStack Query's `useInfiniteQuery` with Supabase `range()` for offset pagination
**When to use:** Activity feeds, user lists, any scrollable data needing pagination
**Example:**
```typescript
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
// Adapted for Supabase range() pagination

const PAGE_SIZE = 20;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const start = pageParam * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      return getFeedLogs(start, end);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // Return undefined when no more pages (less than PAGE_SIZE returned)
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + 1;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (feeds change frequently)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (mobile-optimized)
  });
}
```

### Pattern 2: Supabase Query with Joins for Feed Data
**What:** Single query fetches logs with nested profile and hobby data
**When to use:** Avoid N+1 queries, leverage Supabase automatic relationship detection
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/database/joins-and-nesting

export async function getFeedLogs(start: number, end: number) {
  const { data, error } = await supabase
    .from('hobby_logs')
    .select(`
      id,
      value,
      note,
      image_urls,
      logged_at,
      user:profiles!hobby_logs_user_id_fkey (
        id,
        username,
        avatar_url
      ),
      hobby:hobbies!hobby_logs_hobby_id_fkey (
        id,
        name,
        tracking_type,
        goal_unit
      )
    `)
    .order('logged_at', { ascending: false })
    .range(start, end);

  if (error) throw error;
  return data ?? [];
}
```
**Note:** RLS policies automatically filter to only followed users' logs. No manual filtering needed.

### Pattern 3: Optimized FlatList with Memoization
**What:** FlatList configured for infinite scroll with performance optimizations
**When to use:** Any list with 20+ items, especially with images
**Example:**
```typescript
// Source: https://reactnative.dev/docs/optimizing-flatlist-configuration

const ITEM_HEIGHT = 200; // Estimate for getItemLayout

const FeedList = ({ data, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
  const renderItem = useCallback(({ item }) => (
    <FeedItem log={item} />
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      maxToRenderPerBatch={10}
      windowSize={21}
      removeClippedSubviews={true}
      initialNumToRender={10}
    />
  );
};
```

### Pattern 4: Prevent Duplicate onEndReached Calls
**What:** Use flag to prevent multiple simultaneous page fetches
**When to use:** React Native FlatList with onEndReached (known bug causes multiple triggers)
**Example:**
```typescript
// Source: https://github.com/facebook/react-native/issues/14015
// Community workaround for onEndReached duplicate calls

const FeedList = () => {
  const onEndReachedCalledDuringMomentum = useRef(false);

  return (
    <FlatList
      onMomentumScrollBegin={() => {
        onEndReachedCalledDuringMomentum.current = false;
      }}
      onEndReached={() => {
        if (!onEndReachedCalledDuringMomentum.current && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
          onEndReachedCalledDuringMomentum.current = true;
        }
      }}
    />
  );
};
```

### Pattern 5: Cache Invalidation on New Log Creation
**What:** Invalidate feed when user creates a new log (so followers see it)
**When to use:** Activity feeds that should update after mutations
**Example:**
```typescript
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation

export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLog,
    onSuccess: () => {
      // Invalidate feed so followers see the new log
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      // Also invalidate user's own logs list
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}
```

### Anti-Patterns to Avoid
- **Fetching all logs upfront:** Defeats virtualization, causes memory issues
- **Using ScrollView instead of FlatList:** No virtualization, poor performance with 50+ items
- **Anonymous functions in renderItem:** Causes unnecessary re-renders on every scroll
- **Missing keyExtractor:** React cannot track items efficiently, causes duplicate renders
- **Offset pagination without ORDER BY:** Results unpredictable, causes duplicates across pages

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Infinite scroll state | Custom page counter, manual array concatenation | `useInfiniteQuery` | Handles page params, merging pages, hasNextPage logic automatically |
| List virtualization | Custom windowing logic | FlatList `windowSize` prop | React Native's built-in virtualization is highly optimized |
| Image lazy loading | Custom intersection observer | FlatList built-in + expo-image | FlatList only renders visible items, expo-image caches automatically |
| Pagination with duplicates | Custom deduplication logic | Proper `ORDER BY` + stable sort key | Database-level sorting prevents duplicates across pages |
| Network-aware refetching | Custom NetInfo listeners | TanStack Query's `onlineManager` | Already configured in src/lib/query-client.ts |

**Key insight:** Pagination bugs (duplicates, skipped items) almost always stem from unstable sort order, not implementation logic. Always use `ORDER BY` with a unique fallback (e.g., `logged_at DESC, id DESC`).

## Common Pitfalls

### Pitfall 1: onEndReached Called Multiple Times
**What goes wrong:** FlatList triggers `onEndReached` 2-4 times per scroll event, causing duplicate page fetches
**Why it happens:** React Native bug when scrolling quickly or when ListFooterComponent height changes
**How to avoid:**
1. Use `onMomentumScrollBegin` flag (Pattern 4 above)
2. Check `isFetchingNextPage` before calling `fetchNextPage()`
3. Set `onEndReachedThreshold` to 0.5 (not default)
**Warning signs:** Network tab shows multiple identical requests, pages jump in size

### Pitfall 2: Duplicate Items Across Pages
**What goes wrong:** Same log appears on page 1 and page 2, or items shift between pages
**Why it happens:** No `ORDER BY` clause, or order by non-unique field (e.g., only `logged_at` when multiple logs share timestamp)
**How to avoid:** Always include fallback sort on unique column:
```sql
ORDER BY logged_at DESC, id DESC
```
**Warning signs:** Users report seeing same item twice, feed "jumps" when loading more

### Pitfall 3: RLS Policy Not Enforced in Joins
**What goes wrong:** Nested data (profiles, hobbies) visible even when RLS should block it
**Why it happens:** Forgetting that joined tables also run their RLS policies
**How to avoid:** Test with private profile - verify nested data is filtered. Existing "Followers can view logs" policy handles this correctly.
**Warning signs:** Private user's logs appear in feed, or logs visible without follow relationship

### Pitfall 4: Slow Pagination Due to RLS Subqueries
**What goes wrong:** Feed queries take 500ms+ with RLS, fast without RLS
**Why it happens:** RLS policies like `auth.uid() IN (SELECT ...)` run for every row
**How to avoid:** Ensure indexes exist on foreign keys:
```sql
CREATE INDEX idx_hobby_logs_logged_at ON hobby_logs(logged_at DESC);
CREATE INDEX idx_follows_following_id ON follows(following_id);
```
Already present in schema (lines 103, 78).
**Warning signs:** Query EXPLAIN shows sequential scans, queries slow on large datasets

### Pitfall 5: Stale Feed After Creating Log
**What goes wrong:** User creates log, feed doesn't update to show it (or followers don't see it immediately)
**Why it happens:** TanStack Query caches feed data, mutation doesn't invalidate cache
**How to avoid:** Use Pattern 5 (Cache Invalidation) - invalidate `['feed']` query on log creation
**Warning signs:** User refreshes manually to see new content, followers see stale data

### Pitfall 6: Memory Leak from Infinite Pages
**What goes wrong:** App crashes after scrolling through 500+ items
**Why it happens:** `useInfiniteQuery` keeps all fetched pages in memory indefinitely
**How to avoid:** Set appropriate `gcTime` (24 hours already configured), consider resetting query on tab switch for very long sessions
**Warning signs:** Memory usage climbs steadily, crash on low-memory devices

## Code Examples

Verified patterns from official sources:

### Complete Feed Service with RLS-Aware Query
```typescript
// src/features/feed/services/feed.service.ts
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type FeedLog = {
  id: string;
  value: number;
  note: string | null;
  image_urls: string[] | null;
  logged_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  hobby: {
    id: string;
    name: string;
    tracking_type: 'time' | 'quantity';
    goal_unit: string | null;
  };
};

/**
 * Fetch paginated feed logs for followed users
 * RLS policy "Followers can view logs" automatically filters results
 * @param start - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, inclusive)
 * @returns Array of feed logs with nested user/hobby data
 */
export async function getFeedLogs(start: number, end: number): Promise<FeedLog[]> {
  const { data, error } = await supabase
    .from('hobby_logs')
    .select(`
      id,
      value,
      note,
      image_urls,
      logged_at,
      user:profiles!hobby_logs_user_id_fkey (
        id,
        username,
        avatar_url
      ),
      hobby:hobbies!hobby_logs_hobby_id_fkey (
        id,
        name,
        tracking_type,
        goal_unit
      )
    `)
    .order('logged_at', { ascending: false })
    .order('id', { ascending: false }) // Fallback for stable sort
    .range(start, end);

  if (error) throw error;

  // Type assertion needed due to Supabase nested type limitations
  return (data ?? []) as unknown as FeedLog[];
}
```

### Complete Feed Hook with Infinite Query
```typescript
// src/features/feed/hooks/useFeed.ts
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeedLogs } from '../services/feed.service';

const PAGE_SIZE = 20;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const start = pageParam * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      return getFeedLogs(start, end);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // No more pages if last page returned fewer items than PAGE_SIZE
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + 1;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (feeds change more frequently)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (mobile-optimized, from config)
  });
}
```

### Flattening Infinite Query Pages
```typescript
// Flatten pages array into single array for FlatList
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
const feedItems = data?.pages.flatMap(page => page) ?? [];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Offset pagination with page numbers | Range-based with pageParam multiplier | TanStack Query v5 (2024) | `initialPageParam` now required, clearer page tracking |
| FlatList with custom windowing | FlatList with `removeClippedSubviews` | React Native 0.70+ | Better memory management on Android |
| Manual NetInfo + refetchOnReconnect | Integrated `onlineManager` | TanStack Query v5 | Automatic network-aware refetching |
| Supabase `.gte().lt()` for ranges | Supabase `.range(start, end)` | PostgREST 10+ | More explicit, handles edge cases better |

**Deprecated/outdated:**
- **TanStack Query v4 `keepPreviousData`:** Replaced with `placeholderData: keepPreviousData` in v5 (but not needed for infinite queries)
- **react-native-fast-image:** Community package deprecated, use expo-image instead
- **Manual cursor pagination with Supabase:** Offset-based `range()` acceptable with proper indexes, simpler implementation

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal PAGE_SIZE for mobile feeds**
   - What we know: Sources suggest 10-20 items for performance, FlatList `initialNumToRender` should match first page
   - What's unclear: Tradeoff between fewer network requests (larger pages) vs. faster initial load (smaller pages)
   - Recommendation: Start with 20 items (matches common social media feeds), adjust based on testing. Monitor for "blank areas" during scroll.

2. **Image loading performance with multiple photos per log**
   - What we know: `image_urls` is array, logs can have multiple photos. expo-image handles caching.
   - What's unclear: Should images lazy-load as feed scrolls, or preload next page's images?
   - Recommendation: Let expo-image handle lazy loading automatically. If performance issues arise, consider signed URL caching strategy (see Pitfall below).

3. **Real-time feed updates (stretch goal)**
   - What we know: Supabase Realtime could push new logs to feed. TanStack Query supports manual cache updates.
   - What's unclear: Should feed auto-update with new content (disruptive to reading), or show "New posts" banner?
   - Recommendation: Defer to Phase 5+. Initial implementation uses pull-to-refresh only. If implemented, use banner pattern (like Twitter/X).

## Additional Pitfalls (Low Priority)

### Pitfall 7: Signed URL Performance for Images
**What goes wrong:** Loading 20 feed items with 2 images each = 40 signed URL requests, takes 500ms+
**Why it happens:** Supabase `createSignedUrl` validates each object exists before signing
**How to avoid:**
1. Use `createSignedUrls` (plural) for bulk signing
2. Consider public bucket for user-uploaded images (if privacy allows)
3. Cache signed URLs client-side (they expire, so include expiry in cache key)
**Warning signs:** Network waterfall shows sequential signed URL requests, feed scroll laggy
**Note:** This is LOW priority - only optimize if testing reveals issue.

## Sources

### Primary (HIGH confidence)
- TanStack Query Infinite Queries: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- TanStack Query Invalidation: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- React Native FlatList Optimization: https://reactnative.dev/docs/optimizing-flatlist-configuration
- Supabase Range Pagination: https://supabase.com/docs/reference/javascript/range
- Supabase Joins and Nesting: https://supabase.com/docs/guides/database/joins-and-nesting
- Supabase RLS Performance: https://supabase.com/docs/guides/database/postgres/row-level-security

### Secondary (MEDIUM confidence)
- [TanStack Query Load More Infinite Scroll Example](https://tanstack.com/query/latest/docs/framework/react/examples/load-more-infinite-scroll)
- [React Native FlatList Performance Tips](https://rafalnawojczyk.pl/blog/react-native/flatlist-performance)
- [Supabase Pagination Guide](https://www.restack.io/docs/supabase-knowledge-supabase-pagination-guide)
- [FlatList onEndReached Called Multiple Times Issue](https://github.com/facebook/react-native/issues/14015)
- [Supabase RLS with Joins Discussion](https://github.com/orgs/supabase/discussions/4435)

### Tertiary (LOW confidence, WebSearch only)
- [Stream API Common Mistakes](https://getstream.io/blog/5-common-mistakes-integrating-stream-api/) - General feed patterns, not Supabase-specific
- [Pagination Duplicate Content](https://how2own-seo.com/e-commerce-seo/pagination-and-filtering-how-to-avoid-duplicate-content/) - SEO-focused but illustrates ORDER BY importance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, versions verified
- Architecture: HIGH - Official docs for all patterns, verified with existing codebase structure
- Pitfalls: HIGH - RLS policies verified in schema, onEndReached issue documented in React Native issues
- Performance: MEDIUM - Supabase signed URL performance based on community discussions, not official benchmarks

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stack is stable, React Native/TanStack Query slow-moving)

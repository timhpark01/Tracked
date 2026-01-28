# Phase 3: Social Graph - Research

**Researched:** 2026-01-28
**Domain:** Social Graph (Follow System, User Search, Profile Viewing)
**Confidence:** HIGH

## Summary

This research covers implementing a social graph feature for a React Native/Expo app using Supabase and TanStack Query. The core functionality includes following/unfollowing users, viewing followers/following lists, and searching for users by username.

The existing codebase already has the foundational infrastructure in place: the `follows` table with proper RLS policies, typed database schema, and established patterns for services/hooks using TanStack Query with optimistic updates. The implementation follows a straightforward approach using:
- `ilike` pattern matching for simple username search (no full-text search needed for basic prefix matching)
- Optimistic updates for follow/unfollow with cache invalidation
- Embedded count queries for follower/following counts
- Feature-based organization consistent with existing `profiles/`, `hobbies/`, and `logs/` features

**Primary recommendation:** Create a new `social/` feature module following existing patterns, using simple `ilike` prefix search for usernames and optimistic updates for follow/unfollow mutations with proper cache invalidation of affected queries.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x | Database queries, RLS | Already configured with typed client |
| @tanstack/react-query | ^5.x | State management, caching | Already configured with optimistic update patterns |

### Supporting (No Additional Libraries Needed)
The existing stack is sufficient. No new dependencies required for social graph functionality.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ilike` prefix search | Full-text search with `textSearch()` | Full-text is overkill for simple username prefix matching; `ilike` is simpler and sufficient |
| Manual count queries | PostgreSQL views/functions | Views add complexity; embedded `count` in select is simpler for this use case |
| Separate follow check query | Join with profile fetch | Separate query allows better cache management and simpler RLS |

**Installation:**
```bash
# No additional packages needed - using existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/social/
├── services/
│   └── social.service.ts      # Follow/unfollow, user search, follower queries
├── hooks/
│   ├── useFollowUser.ts       # Mutation: follow with optimistic update
│   ├── useUnfollowUser.ts     # Mutation: unfollow with optimistic update
│   ├── useFollowers.ts        # Query: list of followers for a user
│   ├── useFollowing.ts        # Query: list of users being followed
│   ├── useIsFollowing.ts      # Query: check if current user follows another
│   └── useSearchUsers.ts      # Query: search users by username prefix
└── index.ts                   # Public exports
```

### Pattern 1: Service Layer (Following Existing Pattern)
**What:** Thin service functions that wrap Supabase queries
**When to use:** All database operations
**Example:**
```typescript
// Source: Existing hobbies.service.ts pattern
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Follow = Database['public']['Tables']['follows']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export async function followUser(followerId: string, followingId: string): Promise<Follow> {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) throw error
}
```

### Pattern 2: Username Search with ilike
**What:** Case-insensitive prefix search for usernames
**When to use:** User search functionality (SOCL-05)
**Example:**
```typescript
// Source: Supabase docs - https://supabase.com/docs/reference/javascript/ilike
export async function searchUsers(query: string, limit: number = 20): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `${query}%`)  // Prefix match
    .limit(limit)
    .order('username')

  if (error) throw error
  return data ?? []
}
```

### Pattern 3: Optimistic Updates for Follow/Unfollow
**What:** Update UI immediately, rollback on error
**When to use:** Follow and unfollow mutations
**Example:**
```typescript
// Source: Existing useCreateHobby.ts pattern + TanStack Query docs
export function useFollowUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ followingId }: { followingId: string }) =>
      followUser(user!.id, followingId),
    onMutate: async ({ followingId }) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: ['following', user?.id] })
      await queryClient.cancelQueries({ queryKey: ['isFollowing', user?.id, followingId] })

      // Snapshot previous values
      const previousFollowing = queryClient.getQueryData(['following', user?.id])
      const previousIsFollowing = queryClient.getQueryData(['isFollowing', user?.id, followingId])

      // Optimistically update isFollowing
      queryClient.setQueryData(['isFollowing', user?.id, followingId], true)

      return { previousFollowing, previousIsFollowing, followingId }
    },
    onError: (_err, { followingId }, context) => {
      // Rollback on error
      if (context?.previousFollowing !== undefined) {
        queryClient.setQueryData(['following', user?.id], context.previousFollowing)
      }
      queryClient.setQueryData(['isFollowing', user?.id, followingId], context?.previousIsFollowing)
    },
    onSettled: (_data, _error, { followingId }) => {
      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['followers', followingId] })
      queryClient.invalidateQueries({ queryKey: ['isFollowing', user?.id, followingId] })
      queryClient.invalidateQueries({ queryKey: ['profile', followingId] })  // If showing follower count
    },
  })
}
```

### Pattern 4: Check If Following (For UI State)
**What:** Query to check if current user follows another user
**When to use:** Profile screens, follow buttons
**Example:**
```typescript
export function useIsFollowing(targetUserId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['isFollowing', user?.id, targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user!.id)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (error) throw error
      return data !== null
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    staleTime: 5 * 60 * 1000,
  })
}
```

### Pattern 5: Fetching Followers/Following with Profile Data
**What:** Query followers or following with joined profile information
**When to use:** Followers list, following list screens
**Example:**
```typescript
// Source: Supabase relational queries
export async function getFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  // Extract profile from nested structure
  return data?.map(row => row.follower) ?? []
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following:profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data?.map(row => row.following) ?? []
}
```

### Anti-Patterns to Avoid
- **N+1 queries for isFollowing:** Don't fetch each follow status separately in a list; batch or use query prefetching
- **Forgetting to invalidate related queries:** After follow/unfollow, invalidate followers list, following list, isFollowing, AND profile if showing counts
- **Using exact match instead of prefix:** Use `ilike('username', `${query}%`)` not `ilike('username', query)` for search
- **Checking follow status for self:** Always guard with `user.id !== targetUserId`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Case-insensitive search | Manual `.toLowerCase()` comparison | Supabase `ilike` | Database-level is more efficient, handles Unicode |
| Follow state tracking | Local state with manual sync | TanStack Query with query keys | Automatic cache invalidation, shared across components |
| Follower/following counts | Manual counting queries | Embedded `count` in select or profile column | More efficient, can be indexed |
| Debounced search | Custom debounce hook | useQuery with staleTime + user debounce | TanStack Query handles caching automatically |

**Key insight:** The existing patterns in the codebase (optimistic updates, service layer, query invalidation) already solve these problems. Follow the established patterns from `hobbies/` and `profiles/` features.

## Common Pitfalls

### Pitfall 1: Cache Inconsistency After Follow/Unfollow
**What goes wrong:** User follows someone, but follow button doesn't update, or lists don't reflect change
**Why it happens:** Missing query invalidation for related queries
**How to avoid:** Invalidate ALL related queries in `onSettled`:
- `['following', currentUserId]`
- `['followers', targetUserId]`
- `['isFollowing', currentUserId, targetUserId]`
- `['profile', targetUserId]` (if displaying follower count)
**Warning signs:** UI state diverges from reality, works after page refresh

### Pitfall 2: Race Conditions in Optimistic Updates
**What goes wrong:** Rapid follow/unfollow creates inconsistent state
**Why it happens:** Multiple mutations in flight, responses arrive out of order
**How to avoid:**
- Cancel in-flight queries with `queryClient.cancelQueries()` in `onMutate`
- Disable follow button during mutation (use `isPending` from useMutation)
- Let `onSettled` invalidation restore correct state
**Warning signs:** UI flickers between states, inconsistent data

### Pitfall 3: Self-Follow Attempts
**What goes wrong:** User can attempt to follow themselves
**Why it happens:** UI doesn't hide follow button on own profile
**How to avoid:**
- Database has CHECK constraint: `CHECK (follower_id != following_id)` (already in schema)
- UI: Hide follow button when viewing own profile
- Hook: Guard query with `enabled: user.id !== targetUserId`
**Warning signs:** Error thrown from database constraint

### Pitfall 4: Slow Username Search
**What goes wrong:** Search feels sluggish, especially on typing
**Why it happens:** Querying on every keystroke without debounce
**How to avoid:**
- Debounce search input (300-500ms)
- Use TanStack Query's caching to avoid duplicate requests
- Index on `username` column (already exists in schema)
- Set minimum query length (2-3 characters)
**Warning signs:** Excessive network requests, UI lag

### Pitfall 5: Unbounded List Queries
**What goes wrong:** Followers list takes forever to load for popular users
**Why it happens:** No pagination/limit on query
**How to avoid:**
- Always use `.limit()` on list queries (20-50 items initial load)
- Implement infinite scroll with `useInfiniteQuery` if needed later
- Show "View all X followers" link if count exceeds limit
**Warning signs:** Slow load times, memory issues on large lists

## Code Examples

Verified patterns from official sources:

### User Search Service Function
```typescript
// Following Supabase ilike pattern
export async function searchUsers(
  query: string,
  currentUserId: string,
  limit: number = 20
): Promise<Profile[]> {
  if (query.length < 2) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `${query}%`)
    .neq('id', currentUserId)  // Exclude self
    .limit(limit)
    .order('username')

  if (error) throw error
  return data ?? []
}
```

### useSearchUsers Hook
```typescript
// Following existing hook patterns
export function useSearchUsers(query: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => searchUsers(query, user!.id),
    enabled: !!user && query.length >= 2,
    staleTime: 30 * 1000,  // 30 seconds - search results change
    gcTime: 5 * 60 * 1000,  // 5 minutes
  })
}
```

### Follow Button Component Pattern
```typescript
// Component usage pattern
function FollowButton({ userId }: { userId: string }) {
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(userId)
  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()

  const isPending = followMutation.isPending || unfollowMutation.isPending

  const handlePress = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ followingId: userId })
    } else {
      followMutation.mutate({ followingId: userId })
    }
  }

  if (checkingFollow) return <ActivityIndicator />

  return (
    <Pressable onPress={handlePress} disabled={isPending}>
      <Text>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
    </Pressable>
  )
}
```

### Getting Follow Counts (Optional Enhancement)
```typescript
// If you need follower/following counts on profile
export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ])

  return {
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for follow state | TanStack Query mutations | 2022-2023 | Simpler code, automatic cache management |
| Full-text search for usernames | Simple `ilike` prefix | N/A | Full-text overkill for usernames, `ilike` sufficient |
| Manual cache updates | `invalidateQueries` + optimistic | TanStack Query v5 | More reliable, less code |

**Deprecated/outdated:**
- `cacheTime` option: Renamed to `gcTime` in TanStack Query v5 (already using `gcTime` in codebase)
- Manual refetch after mutations: Use `invalidateQueries` instead

## Open Questions

Things that couldn't be fully resolved:

1. **Pagination Strategy for Large Follower Lists**
   - What we know: Lists should be limited to 20-50 items initially
   - What's unclear: Whether to implement infinite scroll now or defer
   - Recommendation: Start with simple limit (20), add pagination in future phase if needed

2. **Profile Cards in Search Results**
   - What we know: Search returns Profile objects with avatar_url, username, bio
   - What's unclear: What fields to display in search results (avatar + username? Include bio?)
   - Recommendation: Start minimal (avatar + username), enhance based on UX feedback

3. **Aggregate Counts in Profile**
   - What we know: Can query counts separately with `{ count: 'exact', head: true }`
   - What's unclear: Whether to add follower_count/following_count columns to profiles for performance
   - Recommendation: Use query-based counts initially; add denormalized columns only if performance requires

## Sources

### Primary (HIGH confidence)
- Supabase JavaScript Reference - `ilike` filter: https://supabase.com/docs/reference/javascript/ilike
- Supabase JavaScript Reference - `textSearch`: https://supabase.com/docs/reference/javascript/textsearch
- TanStack Query - Optimistic Updates: https://tanstack.com/query/latest/docs/react/guides/optimistic-updates
- TanStack Query - Query Invalidation: https://tanstack.com/query/v4/docs/framework/react/guides/query-invalidation
- Supabase - PostgREST Aggregate Functions: https://supabase.com/blog/postgrest-aggregate-functions
- Existing codebase patterns: `hobbies.service.ts`, `useCreateHobby.ts`, `useDeleteHobby.ts`

### Secondary (MEDIUM confidence)
- TkDodo's Blog - Concurrent Optimistic Updates: https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query
- Managing Query Keys for Cache Invalidation: https://www.wisp.blog/blog/managing-query-keys-for-cache-invalidation-in-react-query

### Tertiary (LOW confidence)
- Community discussions on supabase/supabase GitHub for aggregate count patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing stack, no new dependencies
- Architecture: HIGH - Following established codebase patterns
- Pitfalls: HIGH - Well-documented in TanStack Query and Supabase docs

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (60 days - stable patterns, established stack)

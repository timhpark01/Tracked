# Architecture Research

**Domain:** Mobile social network with progress tracking
**Stack:** Expo, NativeWind, Supabase (Postgres, Auth, Storage), TanStack Query
**Researched:** 2026-01-28
**Confidence:** MEDIUM-HIGH

## Executive Summary

Mobile social apps with progress tracking are structured around three core architectural layers: a **client presentation layer** (React Native with Expo Router), a **data synchronization layer** (TanStack Query managing server state), and a **backend services layer** (Supabase providing database, auth, storage, and real-time capabilities). The architecture follows modern patterns including file-based routing, server-state management separation, and microservices on the backend.

For hobby tracking specifically, the architecture must handle: **user-generated content with media**, **real-time social interactions** (follows, feed updates), **progress data over time**, and **offline-first capabilities** for reliable mobile experiences.

---

## Component Overview

### 1. Client Layer (React Native + Expo)

**Expo Router (File-Based Navigation)**
- **Responsibility:** Application navigation and routing
- **Pattern:** File-system based routing where each file in `app/` directory becomes a route
- **Key Features:**
  - Universal deep linking (works across iOS, Android, web)
  - Built on React Navigation but with automatic configuration
  - Stack navigation by default with support for tabs, drawers
  - Layouts (`_layout.tsx`) for shared UI across screens
  - Route groups with parentheses for organization without URL impact
- **Build Priority:** Phase 1 (Foundation)
- **Source:** [Expo Router Documentation](https://docs.expo.dev/router/introduction/) - HIGH confidence

**UI Components (React Native + NativeWind)**
- **Responsibility:** Presentation and user interaction
- **Pattern:** Functional components with hooks (useState, useEffect, custom hooks)
- **Recommended Structure:**
  - Component composition (small, reusable pieces)
  - Single responsibility principle
  - Feature-based directory organization
  - Screens vs. Components separation
- **Build Priority:** Phase 1 onwards
- **Source:** [Expo Best Practices](https://cursor.directory/expo-react-native-javascript-best-practices) - MEDIUM confidence

**Architecture Pattern (MVVM)**
- **Recommended:** Model-View-ViewModel pattern for React Native
- **Why:** Separates business logic from UI, improves testability, scales well
- **Components:**
  - **View:** React components (UI only)
  - **ViewModel:** Custom hooks and state management
  - **Model:** Data structures and business logic
- **Build Priority:** Apply from Phase 1
- **Source:** [Expo MVVM Template](https://www.bitcot.com/expo-mvvm-template-react-native/) - MEDIUM confidence

### 2. Data Synchronization Layer (TanStack Query)

**State Management Architecture**
- **Server State:** TanStack Query (80% of state management needs)
- **Local State:** useState/useReducer for component-specific state
- **Shared Client State:** Context API or Zustand for lightweight global state
- **Pattern:** Hybrid state management approach
- **Source:** [State Management 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - MEDIUM confidence

**TanStack Query Responsibilities**
- **Caching:** Automatic caching with query keys as unique identifiers
- **Background Sync:** Automatic refetch on window focus and network reconnect
- **Optimistic Updates:** For mutations (likes, follows, post creation)
- **Deduplication:** Prevents duplicate requests
- **Stale-While-Revalidate:** Shows cached data immediately while fetching fresh data
- **React Native Specific Setup:**
  - Use NetInfo for online/offline detection and auto-refetch on reconnect
  - Use AppState to trigger refetch when app becomes active
  - Integrate with Reactotron or Flipper for debugging
- **Source:** [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native) - HIGH confidence

**Layered Architecture Pattern**
```
Presentation Layer (UI Components)
    ↓ uses hooks from
Data Access Layer (useQuery, useMutation hooks)
    ↓ calls functions from
Service Layer (API client functions)
    ↓ communicates with
Backend (Supabase)
```
- **Pattern:** Decouple query options from useQuery hook
- **Benefit:** Testable, reusable, maintainable
- **Source:** [TanStack Query Layered Architecture](https://github.com/TanStack/query/discussions/8547) - MEDIUM confidence

### 3. Backend Services Layer (Supabase)

**Architecture:** Hub-and-spoke microservices model with Postgres at the center

**Component Map:**

| Component | Responsibility | Technology | Communicates With |
|-----------|---------------|------------|-------------------|
| **Kong Gateway** | API gateway, routing all requests | NGINX-based | All services, routes to appropriate microservice |
| **PostgREST** | RESTful API from Postgres schema | Haskell | Postgres, Kong (ingress) |
| **GoTrue** | JWT-based authentication | Go | Postgres, Kong |
| **Realtime** | WebSocket subscriptions, presence | Elixir | Postgres, Kong |
| **Storage API** | S3-compatible object storage | Node.js | Postgres (metadata), Cloud storage |
| **Edge Functions** | Serverless compute | Deno | Postgres, external APIs |
| **Supavisor** | Connection pooler | Elixir | Postgres |
| **postgres-meta** | Database management API | TypeScript | Postgres |
| **Postgres** | Core database (single source of truth) | PostgreSQL | All services |

**Source:** [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture) - HIGH confidence

---

## Data Flow

### Read Flow (Feed/Profile View)

```
User opens screen
    ↓
Expo Router navigates to route
    ↓
Screen component mounts
    ↓
useQuery hook checks cache
    ↓ (cache miss or stale)
TanStack Query calls service function
    ↓
Service function calls Supabase client
    ↓
Supabase JS client → Kong → PostgREST
    ↓
PostgREST queries Postgres (with RLS policies)
    ↓
Response flows back through stack
    ↓
TanStack Query caches result
    ↓
Component re-renders with data
```

### Write Flow (Create Hobby Log)

```
User submits form with photo
    ↓
Component calls useMutation hook
    ↓
Optimistic update (UI shows change immediately)
    ↓
[Parallel operations]:
    ├─ Upload image to Supabase Storage
    │      ↓
    │  Storage API → Cloud storage
    │  Returns public URL
    │
    └─ Insert log record to Postgres
           ↓
       PostgREST → Postgres (with RLS)
       Includes image URL reference
    ↓
Both complete successfully
    ↓
TanStack Query invalidates related queries (feed, profile)
    ↓
Background refetch shows updated data
```

**Note on Image Uploads:**
- Use TUS resumable uploads for large files/unreliable networks
- Optimize images before upload (resolution, format)
- Store metadata in Postgres, actual files in Storage
- Image transformations available on-the-fly (resize, quality, WebP)
- **Source:** [Supabase Storage](https://supabase.com/docs/guides/storage) - HIGH confidence

### Real-Time Flow (New Follow Notification)

```
User A follows User B
    ↓
Client inserts follow record (Write Flow above)
    ↓
Postgres insert triggers notification
    ↓
Realtime service (subscribed via WebSocket)
    ↓
User B's client receives real-time event
    ↓
Component updates UI (new follower badge)
```

### Offline-First Flow (Limited Connectivity)

```
User creates log while offline
    ↓
TanStack Query mutation fails
    ↓
Data stored in AsyncStorage (local queue)
    ↓
NetInfo detects network reconnect
    ↓
TanStack Query onlineManager triggers retry
    ↓
Queued mutations execute with exponential backoff
    ↓
Success → Remove from local queue
    ↓
Invalidate queries, refetch fresh data
```

**Offline-First Libraries to Consider:**
- `@react-native-async-storage/async-storage` - Local data persistence
- `@react-native-community/netinfo` - Network status detection
- Jazz.tools, TinyBase, or Turso (SQLite with sync) - For true local-first
- `react-native-background-fetch` - Background sync when app inactive
- **Source:** [React Native Offline-First 2026](https://javascript.plainenglish.io/building-offline-first-react-native-apps-the-complete-guide-2026-68ff77c7bb06) - MEDIUM confidence

---

## Supabase Schema Patterns

### Row-Level Security (RLS) First

**Critical:** Enable RLS on all tables. This is database-level security enforcement.

```sql
-- Example: Users can only see their own profile or public profiles
CREATE POLICY "Users can view public profiles"
ON profiles FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Example: Users can only create logs for themselves
CREATE POLICY "Users create own logs"
ON hobby_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Pattern:**
- RLS for multi-tenant data isolation (baseline protection)
- Application logic for business rules (workflow-specific)
- Never use `service_role` key in client code (bypasses RLS)
- **Source:** [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices) - HIGH confidence

### Schema Structure for Social Progress Tracking

**Core Tables:**

```
profiles
├─ id (uuid, references auth.users)
├─ username (text, unique)
├─ avatar_url (text, references storage)
├─ bio (text)
├─ created_at (timestamp)
└─ is_public (boolean)

hobbies
├─ id (uuid)
├─ user_id (uuid, references profiles)
├─ name (text)
├─ description (text)
├─ created_at (timestamp)
└─ category (text)

hobby_logs
├─ id (uuid)
├─ hobby_id (uuid, references hobbies)
├─ user_id (uuid, references profiles)
├─ note (text)
├─ image_urls (text[], references storage)
├─ logged_at (timestamp)
├─ created_at (timestamp)
└─ metadata (jsonb) -- flexible for progress metrics

follows
├─ id (uuid)
├─ follower_id (uuid, references profiles)
├─ following_id (uuid, references profiles)
├─ created_at (timestamp)
└─ UNIQUE(follower_id, following_id)

groups (future phase)
├─ id (uuid)
├─ name (text)
├─ description (text)
├─ created_by (uuid, references profiles)
└─ created_at (timestamp)

group_members (future phase)
├─ id (uuid)
├─ group_id (uuid, references groups)
├─ user_id (uuid, references profiles)
├─ role (text) -- admin, member
└─ joined_at (timestamp)
```

### Database Patterns

**1. Use Foreign Keys and Constraints**
- Maintain referential integrity at database level
- Use `ON DELETE CASCADE` where appropriate (e.g., logs when hobby deleted)
- Use CHECK constraints for validation (e.g., `CHECK (username ~ '^[a-zA-Z0-9_]+$')`)

**2. Indexes for Query Performance**
```sql
-- Feed queries: "show me recent logs from people I follow"
CREATE INDEX idx_logs_user_created ON hobby_logs(user_id, created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**3. Use JSONB for Flexible Data**
- `metadata` column in `hobby_logs` for extensible progress metrics
- Example: `{"duration_minutes": 45, "difficulty": "medium", "mood": "accomplished"}`
- Indexable with GIN indexes if needed: `CREATE INDEX ON hobby_logs USING GIN (metadata);`

**4. Realtime Subscriptions**
```typescript
// Subscribe to new logs from followed users
supabase
  .channel('feed-updates')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'hobby_logs',
      filter: `user_id=in.(${followedUserIds})`
    },
    (payload) => {
      // Handle new log in feed
    }
  )
  .subscribe()
```

**5. Storage Organization**
```
buckets/
├─ avatars/
│  └─ {user_id}/{filename}
├─ hobby-logs/
│  └─ {user_id}/{hobby_id}/{timestamp}-{filename}
└─ group-media/ (future)
   └─ {group_id}/{filename}
```

**Storage Policies (RLS for Storage):**
```sql
-- Anyone can view public avatars
CREATE POLICY "Public avatars viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can only upload to their own avatar folder
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Patterns to Follow

### Pattern 1: Feature-Based Directory Structure
**What:** Organize code by feature, not by technical role
**When:** From Phase 1 onwards
**Why:** Scales better, easier to find related code, supports independent development

```
src/
├─ features/
│  ├─ auth/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ services/
│  │  └─ screens/
│  ├─ feed/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ services/
│  │  └─ screens/
│  ├─ profile/
│  └─ hobbies/
├─ shared/
│  ├─ components/
│  ├─ hooks/
│  └─ utils/
└─ lib/
   ├─ supabase.ts
   └─ query-client.ts
```

### Pattern 2: Custom Query Hooks
**What:** Wrap TanStack Query hooks in domain-specific hooks
**When:** Phase 2 onwards (when data fetching begins)
**Why:** Encapsulates query keys, keeps components clean, reusable across screens

```typescript
// features/feed/hooks/useFeedQuery.ts
export function useFeedQuery() {
  const { data: followedUsers } = useFollowedUsers()

  return useQuery({
    queryKey: ['feed', followedUsers?.map(u => u.id)],
    queryFn: () => feedService.getFeed(followedUsers),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!followedUsers,
  })
}

// In component:
const { data: feed, isLoading } = useFeedQuery()
```

### Pattern 3: Optimistic Updates for Social Actions
**What:** Update UI immediately, rollback on error
**When:** Phase 3 (Social Features)
**Why:** Feels instant, better UX, common in social apps

```typescript
const followMutation = useMutation({
  mutationFn: (userId: string) => followsService.follow(userId),
  onMutate: async (userId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['follows'])

    // Snapshot previous value
    const previousFollows = queryClient.getQueryData(['follows'])

    // Optimistically update
    queryClient.setQueryData(['follows'], (old) => [...old, { id: userId }])

    // Return rollback function
    return { previousFollows }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['follows'], context.previousFollows)
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries(['follows'])
  }
})
```

### Pattern 4: Cursor-Based Pagination for Feed
**What:** Use cursor (ID or timestamp) instead of offset
**When:** Phase 2 (Feed implementation)
**Why:** Handles dynamic data (new posts) better than offset pagination

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage
} = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) =>
    supabase
      .from('hobby_logs')
      .select('*')
      .lt('created_at', pageParam || new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
  getNextPageParam: (lastPage) =>
    lastPage.length === 20
      ? lastPage[lastPage.length - 1].created_at
      : undefined,
})
```

**Source:** [Social Feed System Design](https://javatechonline.com/social-media-feed-system-design/) - MEDIUM confidence

### Pattern 5: Background Sync with NetInfo
**What:** Detect network reconnection and sync pending operations
**When:** Phase 4 or 5 (if offline support prioritized)
**Why:** Reliability for mobile apps with spotty connectivity

```typescript
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      queryClient.refetchQueries({ type: 'active' })
    }
  })

  return () => unsubscribe()
}, [])
```

### Pattern 6: Separate Dev, Staging, Production Environments
**What:** Three separate Supabase projects with same schema
**When:** From Phase 1 (project setup)
**Why:** Safety, testing, CI/CD readiness

- Use Supabase CLI to manage migrations
- Store connection details in `.env` files (gitignored)
- Apply migrations to staging first, test, then production
- **Source:** [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices) - HIGH confidence

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Sensitive Data in Client State
**What:** Storing auth tokens, API keys, or user passwords in Redux/Context/etc.
**Why bad:** Accessible in React DevTools, potential security leak
**Instead:**
- Supabase handles auth tokens automatically (stored in secure storage)
- Never store `service_role` key anywhere in client code
- Use RLS policies instead of client-side filtering

### Anti-Pattern 2: Fetching All Data at Once (No Pagination)
**What:** Loading entire feed or all logs in a single query
**Why bad:** Performance degrades as data grows, poor UX (long waits)
**Instead:**
- Cursor-based pagination for feeds
- Load on demand with `useInfiniteQuery`
- Limit initial queries (e.g., 20 items)

### Anti-Pattern 3: Not Using RLS Policies
**What:** Relying only on client-side filtering or application logic for data access
**Why bad:** Security vulnerability, any API call can access all data
**Instead:**
- Enable RLS on all tables
- Write policies for every CRUD operation
- Test with different user contexts

### Anti-Pattern 4: Tight Coupling Between UI and Data Layer
**What:** Calling Supabase client directly in components
**Why bad:** Hard to test, hard to change backend, violates separation of concerns
**Instead:**
- Use service layer (functions that call Supabase)
- Wrap in custom hooks (TanStack Query)
- Components should only know about hooks, not Supabase

```typescript
// BAD:
function ProfileScreen() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => setProfile(data))
  }, [])
}

// GOOD:
function ProfileScreen() {
  const { data: profile } = useProfileQuery(userId)
}
```

### Anti-Pattern 5: Ignoring React Native's New Architecture
**What:** Using libraries that don't support the New Architecture (legacy bridge)
**Why bad:** Performance issues, missing features, future compatibility problems
**Instead:**
- Run `npx expo-doctor` to check library compatibility
- Prefer libraries with New Architecture support
- Migrate legacy libraries during Phase 1 setup
- **Source:** [React Native New Architecture](https://docs.expo.dev/guides/new-architecture/) - HIGH confidence

### Anti-Pattern 6: Not Handling Offline States
**What:** Assuming network is always available, showing error screens on failure
**Why bad:** Poor mobile UX, users expect apps to work with spotty connectivity
**Instead:**
- Show cached data with "syncing" indicator
- Queue mutations when offline, retry on reconnect
- Use `isLoading`, `isError`, `isFetching` states from TanStack Query appropriately

### Anti-Pattern 7: Over-Normalization or Under-Normalization
**What:** Either joining 10 tables for a simple query, or duplicating data everywhere
**Why bad:** Performance issues, data inconsistencies
**Instead:**
- Normalize critical relationships (users, hobbies, logs)
- Denormalize read-heavy data (e.g., follower counts)
- Use Postgres views for complex queries
- Balance between query simplicity and data integrity

---

## Scalability Considerations

| Concern | At 100 Users | At 10K Users | At 1M Users |
|---------|--------------|--------------|-------------|
| **Feed Generation** | Query follows + logs on-demand | Cache feed in Redis (Supabase Cache) | Pre-compute feeds, background workers |
| **Database Connections** | Direct connections (default) | Enable Supavisor pooling | Connection pooler + read replicas |
| **Image Storage** | Supabase Storage (default) | Enable CDN + transformations | CDN + edge caching + lazy loading |
| **Real-Time Subscriptions** | Direct WebSocket connections | Channel-based subscriptions | Pub/sub architecture, presence channels |
| **Search** | Postgres full-text search | Add GIN indexes | Consider Elasticsearch or Typesense |
| **Analytics** | Basic Postgres queries | Separate analytics tables | Time-series DB (InfluxDB) or BI tools |

**Key Scalability Patterns:**
- **Horizontal Scaling:** Supabase supports PostgreSQL horizontal scaling
- **Edge Functions:** Offload compute-heavy tasks (image processing, notifications)
- **Caching Strategy:** Stale-while-revalidate for social data (acceptable staleness)
- **Background Jobs:** Use Supabase Edge Functions or external queue (BullMQ) for async tasks

**Source:** [Social Media App Architecture](https://marutitech.com/social-media-app-architecture-instagram-design/) - MEDIUM confidence

---

## Suggested Build Order

Based on component dependencies and architectural patterns:

### Phase 1: Foundation (Week 1-2)
**Build:**
1. Expo project setup with New Architecture enabled
2. Expo Router file structure (app directory)
3. Supabase project initialization (dev environment)
4. TanStack Query setup with React Native config (NetInfo, AppState)
5. Basic layout components (_layout.tsx files)
6. Environment configuration (.env files)

**Why First:** Everything depends on this foundation. Navigation, data fetching, and backend must be configured before any features.

### Phase 2: Authentication (Week 2-3)
**Build:**
1. Supabase Auth integration (GoTrue)
2. Auth screens (login, signup, password reset)
3. RLS policies for auth tables
4. Protected routes in Expo Router
5. Session management with TanStack Query

**Why Second:** Social features and user-generated content require authentication. Most tables will reference `auth.uid()` in RLS policies.

### Phase 3: Core Data Models (Week 3-4)
**Build:**
1. Database schema (profiles, hobbies, hobby_logs tables)
2. RLS policies for each table
3. Supabase Storage buckets (avatars, hobby-logs)
4. Storage RLS policies
5. Service layer functions (profile, hobby, log CRUD)
6. Custom TanStack Query hooks

**Why Third:** Data models must exist before UI can display or create content. Services and hooks abstract Supabase complexity.

### Phase 4: User Profiles & Hobby Tracking (Week 4-5)
**Build:**
1. Profile screens (view, edit)
2. Hobby creation and management
3. Log creation with image upload (TUS resumable uploads)
4. Progress visualization (list, calendar, charts)

**Why Fourth:** Core value proposition. Users need this before social features make sense. Tests data flow patterns.

### Phase 5: Social Features - Follows (Week 5-6)
**Build:**
1. Follows table and RLS policies
2. Follow/unfollow functionality with optimistic updates
3. Followers/following lists
4. Profile discovery (search)

**Why Fifth:** Foundation for feed. Feed requires knowing who user follows.

### Phase 6: Social Feed (Week 6-7)
**Build:**
1. Feed query (joins follows + logs)
2. Cursor-based pagination with `useInfiniteQuery`
3. Feed UI with infinite scroll
4. Real-time subscription for new logs (optional)

**Why Sixth:** Feed depends on follows, logs, and profiles all existing. Most complex query.

### Phase 7: Groups (Week 7-8) - Future Phase
**Build:**
1. Groups and group_members tables
2. Group creation, joining, leaving
3. Group-specific feeds
4. Group permissions and roles

**Why Seventh:** Extends social features, not core MVP. Can be deferred.

### Phase 8: Offline Support (Week 8+) - Future Phase
**Build:**
1. AsyncStorage integration for queued mutations
2. NetInfo-based retry logic
3. Background sync with `react-native-background-fetch`
4. UI indicators for offline state

**Why Last:** Adds reliability but not core functionality. Requires stable feature set to avoid complex conflict resolution.

---

## Build Order Rationale

**Dependency Chain:**
```
Foundation (Expo, Supabase, TanStack Query)
    ↓
Auth (required for RLS, user context)
    ↓
Data Models (required for features)
    ↓
Core Features (profiles, hobbies, logs)
    ↓
Social Features (follows)
    ↓
Feed (depends on follows + logs)
    ↓
Advanced Features (groups, offline)
```

**Key Principles:**
1. **Infrastructure first** - Can't build features without foundation
2. **Auth early** - Most features require it, easier to build with it from start
3. **Core before social** - Users need content to share before social makes sense
4. **Simple to complex** - Follows before groups, single feed before multiple
5. **Offline last** - Requires stable feature set to avoid complex sync issues

---

## Technology Integration Points

### Expo + Supabase
- Use `supabase-js` library for client
- Configure with anon key (safe for client)
- Auto-handle auth tokens and refresh

### TanStack Query + Supabase
- Wrap Supabase calls in query/mutation functions
- Use query keys based on Supabase table + filters
- Leverage automatic cache invalidation after mutations

### Expo Router + Auth
- Use `redirect` in `_layout.tsx` to protect routes
- Check Supabase session in root layout
- Navigate to auth screens if no session

### NativeWind + Components
- Utility-first styling for rapid development
- Consistent with responsive design patterns
- Works with Expo Router's file-based structure

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Expo Router patterns | HIGH | Official Expo documentation, widely adopted |
| TanStack Query setup | HIGH | Official React Native docs, established patterns |
| Supabase architecture | HIGH | Official Supabase architecture documentation |
| RLS best practices | HIGH | Supabase security documentation, multiple sources agree |
| Feed architecture | MEDIUM | Community patterns from WebSearch, not Supabase-specific |
| Offline-first patterns | MEDIUM | Multiple sources agree, but implementation details vary |
| Build order | MEDIUM | Based on logical dependencies and social app patterns |
| Scalability specifics | LOW-MEDIUM | General patterns, not tested at scale for this exact stack |

---

## Open Questions for Phase-Specific Research

1. **Feed Ranking Algorithm** - How to personalize feed order? (Phase 6)
2. **Image Optimization Pipeline** - Client-side vs server-side compression? (Phase 4)
3. **Notification Strategy** - Push notifications architecture? (Future)
4. **Analytics Integration** - How to track user behavior without privacy concerns? (Future)
5. **Conflict Resolution** - How to handle offline conflicts (two devices edit same hobby)? (Phase 8)

---

## Sources

**HIGH Confidence:**
- [Expo Router Introduction](https://docs.expo.dev/router/introduction/)
- [Expo Router Core Concepts](https://docs.expo.dev/router/basics/core-concepts/)
- [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native)
- [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [React Native New Architecture](https://docs.expo.dev/guides/new-architecture/)

**MEDIUM Confidence:**
- [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices)
- [Expo MVVM Template](https://www.bitcot.com/expo-mvvm-template-react-native/)
- [State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)
- [Social Feed System Design](https://javatechonline.com/social-media-feed-system-design/)
- [React Native Offline-First 2026](https://javascript.plainenglish.io/building-offline-first-react-native-apps-the-complete-guide-2026-68ff77c7bb06)
- [Building Offline-First React Native Apps](https://dev.to/zidanegimiga/building-offline-first-applications-with-react-native-3626)
- [Expo Local-First Documentation](https://docs.expo.dev/guides/local-first/)
- [Mobile App Architecture Patterns 2026](https://impacttechlab.com/future-proof-your-app-the-2026-blueprint-for-unbeatable-mobile-app-architecture/)
- [Social Media App Architecture](https://marutitech.com/social-media-app-architecture-instagram-design/)
- [How to Build Social Feeds in Mobile Apps](https://www.social.plus/answers/how-to-build-social-feeds-in-a-mobile-app)
